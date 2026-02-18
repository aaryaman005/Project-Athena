"""
Project Athena - AWS Remediation Module
Handles active response actions against AWS APIs
"""
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from datetime import datetime

class AWSRemediator:
    """
    Executes remediation actions in AWS.
    """
    
    def __init__(self, region: str = "us-east-1"):
        self.region = region
        self._iam_client = None
    
    @property
    def iam(self):
        """Lazy-load IAM client"""
        if self._iam_client is None:
            try:
                self._iam_client = boto3.client('iam', region_name=self.region)
            except NoCredentialsError:
                raise RuntimeError("AWS credentials not configured")
        return self._iam_client

    def detach_policy(self, target_arn: str, policy_arn: str) -> dict:
        """Detach a managed policy from a user, group, or role"""
        try:
            # Determine target type from ARN
            if ':user/' in target_arn:
                username = target_arn.split('/')[-1]
                self.iam.detach_user_policy(UserName=username, PolicyArn=policy_arn)
                return {"status": "success", "message": f"Detached {policy_arn} from user {username}"}
            
            elif ':role/' in target_arn:
                role_name = target_arn.split('/')[-1]
                self.iam.detach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
                return {"status": "success", "message": f"Detached {policy_arn} from role {role_name}"}
                
            elif ':group/' in target_arn:
                group_name = target_arn.split('/')[-1]
                self.iam.detach_group_policy(GroupName=group_name, PolicyArn=policy_arn)
                return {"status": "success", "message": f"Detached {policy_arn} from group {group_name}"}
            
            else:
                return {"status": "error", "message": "Unknown target type"}
                
        except ClientError as e:
            return {"status": "error", "message": str(e)}

    def disable_user(self, username: str) -> dict:
        """Disable console access for a user"""
        try:
            # Delete login profile to disable console access
            self.iam.delete_login_profile(UserName=username)
            return {"status": "success", "message": f"Disabled console access for user {username}"}
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                return {"status": "skipped", "message": f"User {username} has no login profile"}
            return {"status": "error", "message": str(e)}

    def disable_access_keys(self, username: str) -> dict:
        """Disable all active access keys for a user"""
        results = []
        try:
            keys = self.iam.list_access_keys(UserName=username)
            for key in keys['AccessKeyMetadata']:
                if key['Status'] == 'Active':
                    self.iam.update_access_key(
                        UserName=username,
                        AccessKeyId=key['AccessKeyId'],
                        Status='Inactive'
                    )
                    results.append(key['AccessKeyId'])
            
            if not results:
                return {"status": "skipped", "message": "No active keys found"}
                
            return {"status": "success", "message": f"Disabled keys: {', '.join(results)}"}
        except ClientError as e:
            return {"status": "error", "message": str(e)}
            
    def revoke_sessions(self, target_name: str, target_type: str = 'role') -> dict:
        """
        Revoke active sessions.
        For roles: Revoke all active sessions by adding an inline policy denying all actions before now.
        For users: Adds an inline policy denying all actions before now.
        Note: This is a robust way to kill active sessions.
        """
        policy_name = f"RevokeSessions-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        policy_doc = f'''{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Deny",
                    "Action": "*",
                    "Resource": "*",
                    "Condition": {{
                        "DateLessThan": {{
                            "aws:TokenIssueTime": "{datetime.utcnow().isoformat()}Z"
                        }}
                    }}
                }}
            ]
        }}'''
        
        try:
            if target_type == 'role':
                self.iam.put_role_policy(
                    RoleName=target_name,
                    PolicyName=policy_name,
                    PolicyDocument=policy_doc
                )
            elif target_type == 'user':
                self.iam.put_user_policy(
                    UserName=target_name,
                    PolicyName=policy_name,
                    PolicyDocument=policy_doc
                )
            return {"status": "success", "message": f"Revoked sessions for {target_name} via policy {policy_name}"}
        except ClientError as e:
            return {"status": "error", "message": str(e)}

# Singleton instance
aws_remediator = AWSRemediator()
