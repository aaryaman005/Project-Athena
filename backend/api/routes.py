"""
Project Athena - API Routes
RESTful API endpoints for the Athena platform
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from core.graph import identity_graph
from core.aws_ingester import aws_ingester
from core.detection import detection_engine
from core.response import response_engine


router = APIRouter()


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
def ingest_aws_data():
    """Ingest live IAM data from AWS account"""
    try:
        results = aws_ingester.ingest_all()
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
def scan_for_attacks(start_node: Optional[str] = None, min_delta: int = 20):
    """Scan for privilege escalation attack paths"""
    paths = detection_engine.find_escalation_paths(
        start_node=start_node,
        min_privilege_delta=min_delta
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
def approve_response(plan_id: str):
    """Approve a pending response plan"""
    result = response_engine.approve_plan(plan_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/reject/{plan_id}")
def reject_response(plan_id: str, reason: str = "Rejected by analyst"):
    """Reject a pending response plan"""
    result = response_engine.reject_plan(plan_id, reason)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/execute/{plan_id}")
def execute_response(plan_id: str):
    """Execute an approved response plan"""
    result = response_engine.execute_plan(plan_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/response/rollback/{action_id}")
def rollback_action(action_id: str):
    """Rollback a previously executed action"""
    result = response_engine.rollback_action(action_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
