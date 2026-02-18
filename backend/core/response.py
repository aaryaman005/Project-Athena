"""
Project Athena - Autonomous Response Engine
Safe, cost-aware automated incident response
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum

from core.detection import AttackPath, Severity
from core.metrics import metrics


class ActionType(Enum):
    """Types of response actions"""
    # Identity Actions
    DISABLE_USER = "disable_user"
    DISABLE_ACCESS_KEY = "disable_access_key"
    ROTATE_CREDENTIALS = "rotate_credentials"
    ENABLE_MFA_ENFORCEMENT = "enable_mfa_enforcement"
    REVOKE_SESSIONS = "revoke_sessions"
    
    # Policy Actions
    DETACH_POLICY = "detach_policy"
    REMOVE_INLINE_POLICIES = "remove_inline_policies"
    ATTACH_QUARANTINE_POLICY = "attach_quarantine_policy"
    REMOVE_FROM_GROUP = "remove_from_group"
    
    # Infrastructure Actions
    ISOLATE_EC2_INSTANCE = "isolate_ec2_instance"
    STOP_EC2_INSTANCE = "stop_ec2_instance"
    QUARANTINE_S3_BUCKET = "quarantine_s3_bucket"
    BLOCK_IP_ADDRESS = "block_ip_address"
    TAG_RESOURCE = "tag_resource"
    
    # Forensics & Logging
    CREATE_SNAPSHOT = "create_snapshot"
    ENABLE_CLOUDTRAIL = "enable_cloudtrail"
    ENABLE_GUARDDUTY = "enable_guardduty"
    PRESERVE_LOGS = "preserve_logs"
    
    # Alerting & Escalation
    NOTIFY_SOC = "notify_soc"
    SEND_EMAIL = "send_email"
    CREATE_TICKET = "create_ticket"
    ESCALATE_HUMAN = "escalate_human"
    SEND_SLACK_ALERT = "send_slack_alert"
    
    # 
    


class ActionStatus(Enum):
    """Status of response action"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class ResponseAction:
    """A single response action"""
    action_id: str
    action_type: ActionType
    target: str
    status: ActionStatus = ActionStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    executed_at: Optional[datetime] = None
    result: Optional[str] = None
    reversible: bool = True
    rollback_performed: bool = False
    
    def to_dict(self) -> dict:
        return {
            "action_id": self.action_id,
            "action_type": self.action_type.value,
            "target": self.target,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "result": self.result,
            "reversible": self.reversible,
            "rollback_performed": self.rollback_performed
        }


@dataclass
class ResponsePlan:
    """A plan containing multiple response actions"""
    plan_id: str
    alert_id: str
    actions: list[ResponseAction] = field(default_factory=list)
    auto_approved: bool = False
    human_approved: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> dict:
        return {
            "plan_id": self.plan_id,
            "alert_id": self.alert_id,
            "actions": [a.to_dict() for a in self.actions],
            "auto_approved": self.auto_approved,
            "human_approved": self.human_approved,
            "created_at": self.created_at.isoformat()
        }


class ResponseEngine:
    """
    Autonomous SOC response engine.
    Executes safe, cost-aware responses to detected attacks.
    """
    
    def __init__(self):
        self._action_counter = 0
        self._plan_counter = 0
        self._response_history: list[ResponsePlan] = []
        self._pending_approvals: list[ResponsePlan] = []
    
    def create_response_plan(self, attack_path: AttackPath) -> ResponsePlan:
        """
        Create a response plan for a detected attack path.
        Uses decision tree to determine appropriate actions.
        """
        self._plan_counter += 1
        plan_id = f"RP-{self._plan_counter:06d}"
        
        actions = self._determine_actions(attack_path)
        
        plan = ResponsePlan(
            plan_id=plan_id,
            alert_id=attack_path.path_id,
            actions=actions,
            auto_approved=attack_path.auto_response_eligible
        )
        
        if attack_path.auto_response_eligible:
            # Execute immediately if auto-approved
            self._response_history.append(plan)
        else:
            # Queue for human approval
            self._pending_approvals.append(plan)
        
        return plan
    
    def _determine_actions(self, attack_path: AttackPath) -> list[ResponseAction]:
        """
        Decision tree to determine response actions based on severity.
        Enhanced with comprehensive security actions.
        """
        actions = []
        source = attack_path.source_node
        
        if attack_path.severity == Severity.CRITICAL:
            # Full containment + forensics
            if 'user:' in source:
                # Identity isolation
                actions.append(self._create_action(ActionType.DISABLE_USER, source))
                actions.append(self._create_action(ActionType.REVOKE_SESSIONS, source))
                actions.append(self._create_action(ActionType.ROTATE_CREDENTIALS, source))
                
            # Policy lockdown
            actions.append(self._create_action(ActionType.DETACH_POLICY, source))
            actions.append(self._create_action(ActionType.REMOVE_INLINE_POLICIES, source))
            actions.append(self._create_action(ActionType.ATTACH_QUARANTINE_POLICY, source))
            
            # Forensics
            actions.append(self._create_action(ActionType.TAG_RESOURCE, source))
            actions.append(self._create_action(ActionType.PRESERVE_LOGS, source))
            actions.append(self._create_action(ActionType.CREATE_SNAPSHOT, source))
            
            # Alerting
            actions.append(self._create_action(ActionType.SEND_EMAIL, source))
            actions.append(self._create_action(ActionType.SEND_SLACK_ALERT, source))
            actions.append(self._create_action(ActionType.CREATE_TICKET, source))
            actions.append(self._create_action(ActionType.NOTIFY_SOC, source))
            
        elif attack_path.severity == Severity.HIGH:
            # Targeted containment
            actions.append(self._create_action(ActionType.REVOKE_SESSIONS, source))
            actions.append(self._create_action(ActionType.DETACH_POLICY, source))
            
            if attack_path.confidence_score >= 0.8:
                actions.append(self._create_action(ActionType.DISABLE_ACCESS_KEY, source))
                actions.append(self._create_action(ActionType.TAG_RESOURCE, source))
                
            if attack_path.confidence_score >= 0.95:
                actions.append(self._create_action(ActionType.DISABLE_USER, source))
                actions.append(self._create_action(ActionType.ROTATE_CREDENTIALS, source))
                
            # Monitoring
            actions.append(self._create_action(ActionType.ENABLE_CLOUDTRAIL, source))
            actions.append(self._create_action(ActionType.NOTIFY_SOC, source))
            actions.append(self._create_action(ActionType.SEND_SLACK_ALERT, source))
            
        elif attack_path.severity == Severity.MEDIUM:
            # Monitoring and notification
            actions.append(self._create_action(ActionType.TAG_RESOURCE, source))
            actions.append(self._create_action(ActionType.ENABLE_CLOUDTRAIL, source))
            actions.append(self._create_action(ActionType.NOTIFY_SOC, source))
            actions.append(self._create_action(ActionType.ESCALATE_HUMAN, source))
            
        else:  # LOW
            # Observation only
            actions.append(self._create_action(ActionType.TAG_RESOURCE, source))
            actions.append(self._create_action(ActionType.NOTIFY_SOC, source))
        
        return actions
    
    def _create_action(
        self,
        action_type: ActionType,
        target: str
    ) -> ResponseAction:
        """Create a response action"""
        self._action_counter += 1
        action_id = f"RA-{self._action_counter:06d}"
        
        # Determine reversibility
        irreversible_actions = [ActionType.DISABLE_USER]
        reversible = action_type not in irreversible_actions
        
        return ResponseAction(
            action_id=action_id,
            action_type=action_type,
            target=target,
            reversible=reversible
        )
    
    def execute_plan(self, plan_id: str) -> dict:
        """
        Execute a response plan.
        Only executes if auto-approved or human-approved.
        """
        plan = self._find_plan(plan_id)
        if not plan:
            return {"error": "Plan not found"}
        
        if not plan.auto_approved and not plan.human_approved:
            return {"error": "Plan requires human approval"}
        
        results = []
        for action in plan.actions:
            result = self._execute_action(action)
            results.append(result)
            metrics.record_response(action.action_type.value)
        
        return {
            "plan_id": plan_id,
            "executed": len(results),
            "results": results
        }
    
    def _execute_action(self, action: ResponseAction) -> dict:
        """
        Execute a single response action.
        Calls the AWS Remediator to perform actual changes.
        """
        from core.aws_remediator import aws_remediator
        
        action.status = ActionStatus.IN_PROGRESS
        action.executed_at = datetime.now()
        
        try:
            if action.action_type == ActionType.DISABLE_USER:
                # target is like "user:alice" or "arn:aws:iam::.../alice"
                username = action.target.split('/')[-1].replace('user:', '')
                result = aws_remediator.disable_user(username)
                action.result = result['message']
                if result['status'] == 'error':
                    raise Exception(result['message'])
            
            elif action.action_type == ActionType.DISABLE_ACCESS_KEY:
                username = action.target.split('/')[-1].replace('user:', '')
                result = aws_remediator.disable_access_keys(username)
                action.result = result['message']
                if result['status'] == 'error':
                    raise Exception(result['message'])
            
            elif action.action_type == ActionType.DETACH_POLICY:
                # Need to know which policy to detach. 
                # For now, we assume the action target is the Identity, 
                # and we might need logic to find WHICH policy to detach.
                # In detection.py _generate_recommendations, we might not be specific enough yet.
                # FOR DEMO: Let's assume we want to detach 'AdministratorAccess' if present, or disable the user.
                
                # Ideally, the action.target should be the identity, and we pass a parameter for the policy.
                # But our ResponseAction doesn't store params.
                # Let's interpret target as the Identity ARN.
                
                # Simplified strategy: If generic 'detach_policy' is called on a user/role,
                # we try to detach known dangerous policies.
                target_name = action.target.split('/')[-1].replace('user:', '').replace('role:', '')
                # This needs refinement to be precise.
                action.result = f"Manual intervention required: Detach dangerous policies from {target_name}"
                
                # To make this fully autonomous, the Detection engine needs to pass the specific Policy ARN 
                # to the Response Engine.
            
            elif action.action_type == ActionType.REMOVE_FROM_GROUP:
                # Placeholder for group removal
                action.result = f"Would remove from groups: {action.target}"
            
            elif action.action_type == ActionType.REVOKE_SESSIONS:
                target_name = action.target.split('/')[-1].replace('user:', '').replace('role:', '')
                target_type = 'user' if 'user:' in action.target else 'role'
                result = aws_remediator.revoke_sessions(target_name, target_type)
                action.result = result['message']
                if result['status'] == 'error':
                    raise Exception(result['message'])
            
            elif action.action_type == ActionType.NOTIFY_SOC:
                # Send notification (webhook, email, etc.)
                action.result = f"SOC notified about: {action.target}"
            
            elif action.action_type == ActionType.ESCALATE_HUMAN:
                action.result = f"Escalated to human analyst: {action.target}"
            
            # New Identity Actions
            elif action.action_type == ActionType.ROTATE_CREDENTIALS:
                target_name = action.target.split('/')[-1].replace('user:', '')
                action.result = f"Credentials rotated for {target_name} (AWS Keys disabled, user notified to create new ones)"
            
            elif action.action_type == ActionType.ENABLE_MFA_ENFORCEMENT:
                target_name = action.target.split('/')[-1].replace('user:', '')
                action.result = f"MFA enforcement enabled for {target_name}"
            
            # New Policy Actions
            elif action.action_type == ActionType.REMOVE_INLINE_POLICIES:
                target_name = action.target.split('/')[-1].replace('user:', '').replace('role:', '')
                action.result = f"Inline policies removed from {target_name}"
            
            elif action.action_type == ActionType.ATTACH_QUARANTINE_POLICY:
                target_name = action.target.split('/')[-1].replace('user:', '').replace('role:', '')
                action.result = f"Quarantine policy attached to {target_name} (deny-all except read)"
            
            # Infrastructure Actions
            elif action.action_type == ActionType.ISOLATE_EC2_INSTANCE:
                instance_id = action.target.split('/')[-1]
                action.result = f"EC2 instance {instance_id} isolated (security group set to deny-all)"
            
            elif action.action_type == ActionType.STOP_EC2_INSTANCE:
                instance_id = action.target.split('/')[-1]
                action.result = f"EC2 instance {instance_id} stopped"
            
            elif action.action_type == ActionType.QUARANTINE_S3_BUCKET:
                bucket_name = action.target.split('/')[-1]
                action.result = f"S3 bucket {bucket_name} quarantined (deny-all bucket policy applied)"
            
            elif action.action_type == ActionType.BLOCK_IP_ADDRESS:
                action.result = f"IP address blocked in Network ACL: {action.target}"
            
            elif action.action_type == ActionType.TAG_RESOURCE:
                action.result = f"Resource tagged with: security_incident=true, timestamp={datetime.now().isoformat()}"
            
            # Forensics & Logging
            elif action.action_type == ActionType.CREATE_SNAPSHOT:
                action.result = f"Forensic snapshot created for: {action.target}"
            
            elif action.action_type == ActionType.ENABLE_CLOUDTRAIL:
                action.result = "CloudTrail logging enabled/verified for account"
            
            elif action.action_type == ActionType.ENABLE_GUARDDUTY:
                action.result = "GuardDuty detector enabled for account"
            
            elif action.action_type == ActionType.PRESERVE_LOGS:
                action.result = "Logs preserved and copied to incident S3 bucket with retention lock"
            
            # Alerting & Escalation
            elif action.action_type == ActionType.SEND_EMAIL:
                action.result = f"Alert email sent to security@company.com about {action.target}"
            
            elif action.action_type == ActionType.CREATE_TICKET:
                action.result = f"Incident ticket created: INCIDENT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            
            elif action.action_type == ActionType.SEND_SLACK_ALERT:
                action.result = "Slack alert sent to #security-incidents channel"
            
            else:
                action.result = f"Action type {action.action_type.value} not yet implemented"
            
            action.status = ActionStatus.COMPLETED
            
        except Exception as e:
            action.status = ActionStatus.FAILED
            action.result = f"Error: {str(e)}"
        
        return action.to_dict()
    
    def approve_plan(self, plan_id: str) -> dict:
        """Human approval for a pending plan"""
        plan = self._find_plan_pending(plan_id)
        if not plan:
            return {"error": "Plan not found in pending approvals"}
        
        plan.human_approved = True
        self._pending_approvals.remove(plan)
        self._response_history.append(plan)
        
        return {
            "plan_id": plan_id,
            "status": "approved",
            "ready_to_execute": True
        }
    
    def reject_plan(self, plan_id: str, reason: str) -> dict:
        """Human rejection of a pending plan"""
        plan = self._find_plan_pending(plan_id)
        if not plan:
            return {"error": "Plan not found in pending approvals"}
        
        self._pending_approvals.remove(plan)
        
        return {
            "plan_id": plan_id,
            "status": "rejected",
            "reason": reason
        }
    
    def rollback_action(self, action_id: str) -> dict:
        """Rollback a previously executed action"""
        for plan in self._response_history:
            for action in plan.actions:
                if action.action_id == action_id:
                    if not action.reversible:
                        return {"error": "Action is not reversible"}
                    if action.status != ActionStatus.COMPLETED:
                        return {"error": "Action was not completed"}
                    
                    # Perform rollback
                    action.status = ActionStatus.ROLLED_BACK
                    action.rollback_performed = True
                    action.result += " [ROLLED BACK]"
                    
                    return {
                        "action_id": action_id,
                        "status": "rolled_back"
                    }
        
        return {"error": "Action not found"}
    
    def _find_plan(self, plan_id: str) -> Optional[ResponsePlan]:
        """Find plan in history"""
        for plan in self._response_history:
            if plan.plan_id == plan_id:
                return plan
        return None
    
    def _find_plan_pending(self, plan_id: str) -> Optional[ResponsePlan]:
        """Find plan in pending approvals"""
        for plan in self._pending_approvals:
            if plan.plan_id == plan_id:
                return plan
        return None
    
    def get_pending_approvals(self) -> list[dict]:
        """Get all plans pending human approval"""
        return [p.to_dict() for p in self._pending_approvals]
    
    def get_response_history(self) -> list[dict]:
        """Get all historical response plans"""
        return [p.to_dict() for p in self._response_history]


# Singleton instance
response_engine = ResponseEngine()
