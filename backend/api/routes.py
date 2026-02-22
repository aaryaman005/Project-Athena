"""
Project Athena - API Routes
RESTful API endpoints for the Athena platform
"""
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from core.auth import auth_manager

from core.graph import identity_graph
from core.aws_ingester import aws_ingester
from core.detection import detection_engine
from core.response import response_engine
from core.audit import audit_logger


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = auth_manager.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

# ============ Auth Endpoints ============

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth_manager.get_user(form_data.username)
    if not user or not auth_manager.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth_manager.create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}


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
def scan_for_attacks(start_node: Optional[str] = None, min_delta: int = 20, current_user: dict = Depends(get_current_user)):
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
def get_pending_responses():
    """Get response plans pending human approval"""
    pending = response_engine.get_pending_approvals()
    return {"pending": pending, "count": len(pending)}


@router.get("/response/history")
def get_response_history():
    """Get historical response actions"""
    history = response_engine.get_response_history()
    return {"history": history, "count": len(history)}


@router.post("/response/approve/{plan_id}")
def approve_response(plan_id: str, current_user: dict = Depends(get_current_user)):
    """Approve a pending response plan"""
    result = response_engine.approve_plan(plan_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/reject/{plan_id}")
def reject_response(plan_id: str, reason: str = "Rejected by analyst", current_user: dict = Depends(get_current_user)):
    """Reject a pending response plan"""
    result = response_engine.reject_plan(plan_id, reason)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/execute/{plan_id}")
def execute_response(plan_id: str, current_user: dict = Depends(get_current_user)):
    """Execute an approved response plan"""
    result = response_engine.execute_plan(plan_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/rollback/{action_id}")
def rollback_action(action_id: str, current_user: dict = Depends(get_current_user)):
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
def get_audit_logs():
    """Get system audit logs"""
    return {"logs": audit_logger.get_logs()}
