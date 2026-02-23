"""
Project Athena - API Routes
RESTful API endpoints for the Athena platform
"""
import os
import re
import time
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator
from core.auth import auth_manager

from core.graph import identity_graph
from core.aws_ingester import aws_ingester
from core.detection import detection_engine, DEFAULT_MIN_PRIVILEGE_DELTA
from core.response import response_engine
from core.audit import audit_logger
from core.metrics import metrics

# Wire detection -> response integration without module-level back imports.
detection_engine.set_response_plan_handler(response_engine.create_response_plan)


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
RATE_LIMIT_WINDOW_SECONDS = 60
REGISTER_RATE_LIMIT = 5
LOGIN_RATE_LIMIT = 20
_rate_limit_buckets: dict[str, list[float]] = {}


class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()
        if not re.fullmatch(r"[A-Za-z0-9_.-]{3,32}", value):
            raise ValueError("Username must be 3-32 chars and use [A-Za-z0-9_.-]")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 12:
            raise ValueError("Password must be at least 12 characters")
        checks = [
            re.search(r"[A-Z]", value),
            re.search(r"[a-z]", value),
            re.search(r"[0-9]", value),
            re.search(r"[^A-Za-z0-9]", value),
        ]
        if not all(checks):
            raise ValueError("Password must include upper, lower, number, and special character")
        return value


def _enforce_rate_limit(key: str, max_requests: int) -> None:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    attempts = _rate_limit_buckets.get(key, [])
    attempts = [attempt for attempt in attempts if attempt >= window_start]

    if len(attempts) >= max_requests:
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")

    attempts.append(now)
    _rate_limit_buckets[key] = attempts

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = auth_manager.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

def check_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrative privileges required")
    return current_user

# ============ Auth Endpoints ============

@router.post("/auth/login")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    client_ip = request.client.host if request.client else "unknown"
    _enforce_rate_limit(f"login:{client_ip}", LOGIN_RATE_LIMIT)

    user = auth_manager.get_user(form_data.username)
    if not user or not auth_manager.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth_manager.create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/register")
def register(payload: RegisterRequest, request: Request):
    """Register a new user (Public)"""
    client_ip = request.client.host if request.client else "unknown"
    _enforce_rate_limit(f"register:{client_ip}", REGISTER_RATE_LIMIT)

    username = payload.username
    password = payload.password

    if auth_manager.get_user(username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    success = auth_manager.create_user(username, password)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    return {"status": "success", "message": "User registered successfully"}


@router.get("/auth/users")
def list_users(admin: dict = Depends(check_admin)):
    """List all registered users (Admin only)"""
    return {"users": auth_manager.list_users()}


@router.delete("/auth/users/{username}")
def delete_user(username: str, admin: dict = Depends(check_admin)):
    """Remove a user from the system (Admin only)"""
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete default admin account")
    
    if not auth_manager.delete_user(username):
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"status": "success", "message": f"User {username} deleted"}


@router.patch("/auth/users/{username}/role")
def update_user_role(username: str, role: str, admin: dict = Depends(check_admin)):
    """Change a user's role (Admin only)"""
    if not auth_manager.update_user_role(username, role):
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"status": "success", "message": f"User {username} role updated to {role}"}


# ============ Graph Endpoints ============

@router.get("/graph")
def get_graph():
    """Get the complete identity graph for visualization"""
    return identity_graph.to_dict()


@router.get("/graph/stats")
def get_graph_stats():
    """Get graph statistics"""
    return {
        "total_nodes": identity_graph.node_count,
        "total_edges": identity_graph.edge_count
    }


# ============ Identity Endpoints ============

@router.get("/identities")
def list_identities():
    """List all identities in the graph"""
    graph_data = identity_graph.to_dict()
    identities = [
        node for node in graph_data['nodes']
        if node['type'] in ['iam_user', 'iam_role', 'iam_group']
    ]
    return {"identities": identities, "count": len(identities)}


@router.get("/identities/{identity_id}")
def get_identity(identity_id: str):
    """Get specific identity details"""
    node = identity_graph.get_node(identity_id)
    if not node:
        raise HTTPException(status_code=404, detail="Identity not found")
    
    # Get relationships
    neighbors = identity_graph.get_neighbors(identity_id)
    predecessors = identity_graph.get_predecessors(identity_id)
    
    return {
        "identity": node,
        "can_reach": neighbors,
        "reachable_from": predecessors
    }


# ============ AWS Ingestion Endpoints ============

@router.post("/ingest/aws")
def ingest_aws_data(current_user: dict = Depends(get_current_user)):
    """Ingest live IAM data from AWS account"""
    try:
        results = aws_ingester.ingest_all()
        audit_logger.log(
            action="aws_ingest",
            actor="system_admin",
            status="success",
            details=f"Ingested {results.get('total_nodes', 0)} nodes and {results.get('total_edges', 0)} edges."
        )
        return {
            "status": "success",
            "ingested": results
        }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/cloudtrail")
def get_cloudtrail_events(hours: int = 24):
    """Get recent CloudTrail IAM events or mock events for development"""
    try:
        # Check if we should use mock data
        use_mock = os.getenv("USE_MOCK_DATA", "false").lower() == "true"

        if use_mock:
            events = aws_ingester.get_mock_events(hours=hours)
        else:
            events = aws_ingester.get_recent_events(hours=hours)

        return {"events": events, "count": len(events), "mode": "mock" if use_mock else "live"}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ Detection Endpoints ============

@router.post("/detect/scan")
def scan_for_attacks(start_node: Optional[str] = None, min_delta: int = DEFAULT_MIN_PRIVILEGE_DELTA, current_user: dict = Depends(get_current_user)):
    """Scan for privilege escalation attack paths"""
    paths = detection_engine.find_escalation_paths(
        start_node=start_node,
        min_privilege_delta=min_delta
    )
    audit_logger.log(
        action="attack_scan",
        actor="system_admin",
        status="success",
        details=f"Detected {len(paths)} attack paths."
    )
    return {
        "status": "scan_complete",
        "paths_detected": len(paths),
        "paths": [p.to_dict() for p in paths]
    }


@router.get("/alerts")
def get_all_alerts():
    """Get all detected attack path alerts"""
    alerts = detection_engine.get_all_alerts()
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/alerts/priority")
def get_priority_alerts():
    """Get high-priority alerts requiring immediate attention"""
    alerts = detection_engine.get_high_priority_alerts()
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/alerts/{alert_id}")
def get_alert(alert_id: str):
    """Get specific alert details"""
    alert = detection_engine.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


# ============ Response Endpoints ============

@router.get("/response/pending")
def get_pending_responses(admin: dict = Depends(check_admin)):
    """Get response plans pending human approval"""
    pending = response_engine.get_pending_approvals()
    return {"pending": pending, "count": len(pending)}


@router.get("/response/history")
def get_response_history(admin: dict = Depends(check_admin)):
    """Get historical response actions"""
    history = response_engine.get_response_history()
    return {"history": history, "count": len(history)}


@router.post("/response/approve/{plan_id}")
def approve_response(plan_id: str, admin: dict = Depends(check_admin)):
    """Approve a pending response plan"""
    result = response_engine.approve_plan(plan_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/reject/{plan_id}")
def reject_response(plan_id: str, reason: str = "Rejected by analyst", admin: dict = Depends(check_admin)):
    """Reject a pending response plan"""
    result = response_engine.reject_plan(plan_id, reason)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/execute/{plan_id}")
def execute_response(plan_id: str, admin: dict = Depends(check_admin)):
    """Execute an approved response plan"""
    result = response_engine.execute_plan(plan_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/rollback/{action_id}")
def rollback_action(action_id: str, admin: dict = Depends(check_admin)):
    """Rollback a previously executed action"""
    result = response_engine.rollback_action(action_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    audit_logger.log(
        action="action_rollback",
        actor="system_admin",
        target=action_id,
        status="success"
    )
    return result

# ============ Audit Endpoints ============

@router.get("/audit/logs")
def get_audit_logs(admin: dict = Depends(check_admin)):
    """Get system audit logs"""
    return {"logs": audit_logger.get_logs()}


# ============ Health Endpoint ============

@router.get("/health")
def health():
    """Get system health and uptime"""
    return {
        "status": "healthy",
        "service": "athena-core",
        "uptime_seconds": int(time.time() - metrics.start_time)
    }
