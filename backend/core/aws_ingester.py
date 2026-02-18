"""
Project Athena - AWS IAM Integration
Live data ingestion from AWS IAM and CloudTrail, with mock data support
"""
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from datetime import datetime, timedelta

from core.graph import identity_graph, IdentityNode, NodeType, EdgeType
from core.metrics import metrics
from core.mock_data import mock_data_generator


class AWSIngester:
    """
    Ingests live IAM data from AWS account.
    Builds identity graph from real AWS resources.
    """
    
    def __init__(self, region: str = "us-east-1"):
        self.region = region
        self._iam_client = None
        self._cloudtrail_client = None
        self._initialized = False
    
    @property
    def iam(self):
        """Lazy-load IAM client"""
        if self._iam_client is None:
            try:
                self._iam_client = boto3.client('iam', region_name=self.region)
                self._initialized = True
            except NoCredentialsError:
                raise RuntimeError("AWS credentials not configured")
        return self._iam_client
    
    @property
    def cloudtrail(self):
        """Lazy-load CloudTrail client"""
        if self._cloudtrail_client is None:
            try:
                self._cloudtrail_client = boto3.client('cloudtrail', region_name=self.region)
            except NoCredentialsError:
                raise RuntimeError("AWS credentials not configured")
        return self._cloudtrail_client
    
    def ingest_users(self) -> int:
        """Ingest all IAM users into graph"""
        count = 0
        try:
            paginator = self.iam.get_paginator('list_users')
            for page in paginator.paginate():
                for user in page['Users']:
                    node = IdentityNode(
                        id=f"user:{user['UserName']}",
                        node_type=NodeType.IAM_USER,
                        name=user['UserName'],
                        arn=user['Arn'],
                        created_at=user.get('CreateDate', datetime.now()),
                        privilege_level=self._calculate_user_privilege(user['UserName']),
                        metadata={
                            "user_id": user['UserId'],
                            "path": user.get('Path', '/')
                        }
                    )
                    identity_graph.add_node(node)
                    count += 1
                    
                    # Ingest user's attached policies
                    self._ingest_user_policies(user['UserName'])
                    
        except ClientError as e:
            print(f"Error ingesting users: {e}")
        
        return count
    
    def ingest_roles(self) -> int:
        """Ingest all IAM roles into graph"""
        count = 0
        try:
            paginator = self.iam.get_paginator('list_roles')
            for page in paginator.paginate():
                for role in page['Roles']:
                    # Skip AWS service-linked roles for clarity
                    if '/aws-service-role/' in role.get('Path', ''):
                        continue
                    
                    node = IdentityNode(
                        id=f"role:{role['RoleName']}",
                        node_type=NodeType.IAM_ROLE,
                        name=role['RoleName'],
                        arn=role['Arn'],
                        created_at=role.get('CreateDate', datetime.now()),
                        privilege_level=self._calculate_role_privilege(role['RoleName']),
                        metadata={
                            "role_id": role['RoleId'],
                            "path": role.get('Path', '/'),
                            "assume_role_policy": role.get('AssumeRolePolicyDocument', {})
                        }
                    )
                    identity_graph.add_node(node)
                    count += 1
                    
                    # Add assume role edges
                    self._ingest_role_trust(role)
                    
                    # Ingest role's attached policies
                    self._ingest_role_policies(role['RoleName'])
                    
        except ClientError as e:
            print(f"Error ingesting roles: {e}")
        
        return count
    
    def ingest_policies(self) -> int:
        """Ingest customer-managed IAM policies"""
        count = 0
        try:
            paginator = self.iam.get_paginator('list_policies')
            for page in paginator.paginate(Scope='Local'):  # Only customer policies
                for policy in page['Policies']:
                    node = IdentityNode(
                        id=f"policy:{policy['PolicyName']}",
                        node_type=NodeType.POLICY,
                        name=policy['PolicyName'],
                        arn=policy['Arn'],
                        created_at=policy.get('CreateDate', datetime.now()),
                        privilege_level=self._calculate_policy_privilege(policy['Arn']),
                        metadata={
                            "policy_id": policy['PolicyId'],
                            "attachment_count": policy.get('AttachmentCount', 0)
                        }
                    )
                    identity_graph.add_node(node)
                    count += 1
                    
        except ClientError as e:
            print(f"Error ingesting policies: {e}")
        
        return count
    
    def ingest_groups(self) -> int:
        """Ingest IAM groups and group memberships"""
        count = 0
        try:
            paginator = self.iam.get_paginator('list_groups')
            for page in paginator.paginate():
                for group in page['Groups']:
                    node = IdentityNode(
                        id=f"group:{group['GroupName']}",
                        node_type=NodeType.IAM_GROUP,
                        name=group['GroupName'],
                        arn=group['Arn'],
                        created_at=group.get('CreateDate', datetime.now()),
                        metadata={
                            "group_id": group['GroupId'],
                            "path": group.get('Path', '/')
                        }
                    )
                    identity_graph.add_node(node)
                    count += 1
                    
                    # Add group members
                    self._ingest_group_members(group['GroupName'])
                    
        except ClientError as e:
            print(f"Error ingesting groups: {e}")
        
        return count
    
    def _ingest_user_policies(self, username: str) -> None:
        """Add edges from user to attached policies"""
        try:
            # Attached managed policies
            attached = self.iam.list_attached_user_policies(UserName=username)
            for policy in attached.get('AttachedPolicies', []):
                policy_id = f"policy:{policy['PolicyName']}"
                user_id = f"user:{username}"
                identity_graph.add_edge(user_id, policy_id, EdgeType.HAS_POLICY)
        except ClientError:
            pass
    
    def _ingest_role_policies(self, role_name: str) -> None:
        """Add edges from role to attached policies"""
        try:
            attached = self.iam.list_attached_role_policies(RoleName=role_name)
            for policy in attached.get('AttachedPolicies', []):
                policy_id = f"policy:{policy['PolicyName']}"
                role_id = f"role:{role_name}"
                identity_graph.add_edge(role_id, policy_id, EdgeType.HAS_POLICY)
        except ClientError:
            pass
    
    def _ingest_role_trust(self, role: dict) -> None:
        """Parse trust policy to find who can assume this role"""
        trust_policy = role.get('AssumeRolePolicyDocument', {})
        statements = trust_policy.get('Statement', [])
        
        for statement in statements:
            if statement.get('Effect') != 'Allow':
                continue
            
            principals = statement.get('Principal', {})
            
            # Handle AWS principals
            aws_principals = principals.get('AWS', [])
            if isinstance(aws_principals, str):
                aws_principals = [aws_principals]
            
            role_id = f"role:{role['RoleName']}"
            for principal in aws_principals:
                if ':user/' in principal:
                    user_name = principal.split('/')[-1]
                    user_id = f"user:{user_name}"
                    identity_graph.add_edge(user_id, role_id, EdgeType.CAN_ASSUME)
                elif ':role/' in principal:
                    source_role = principal.split('/')[-1]
                    source_id = f"role:{source_role}"
                    identity_graph.add_edge(source_id, role_id, EdgeType.CAN_ASSUME)
    
    def _ingest_group_members(self, group_name: str) -> None:
        """Add edges from users to their groups"""
        try:
            response = self.iam.get_group(GroupName=group_name)
            for user in response.get('Users', []):
                user_id = f"user:{user['UserName']}"
                group_id = f"group:{group_name}"
                identity_graph.add_edge(user_id, group_id, EdgeType.MEMBER_OF)
        except ClientError:
            pass
    
    def _calculate_user_privilege(self, username: str) -> int:
        """Calculate privilege level for a user (0-100)"""
        # Start with base level
        privilege = 10
        
        try:
            # Check for admin policies
            attached = self.iam.list_attached_user_policies(UserName=username)
            for policy in attached.get('AttachedPolicies', []):
                if 'Admin' in policy['PolicyName'] or 'FullAccess' in policy['PolicyName']:
                    privilege = max(privilege, 90)
                elif 'PowerUser' in policy['PolicyName']:
                    privilege = max(privilege, 70)
                elif 'ReadOnly' in policy['PolicyName']:
                    privilege = max(privilege, 20)
                else:
                    privilege = max(privilege, 40)
        except ClientError:
            pass
        
        return privilege
    
    def _calculate_role_privilege(self, role_name: str) -> int:
        """Calculate privilege level for a role (0-100)"""
        privilege = 20
        
        # Check role name keywords
        role_lower = role_name.lower()
        if 'admin' in role_lower or 'root' in role_lower or 'super' in role_lower:
            privilege = max(privilege, 95)
        elif 'power' in role_lower or 'engineer' in role_lower or 'production' in role_lower:
            privilege = max(privilege, 75)
        elif 'billing' in role_lower or 'security' in role_lower or 'auditor' in role_lower:
            privilege = max(privilege, 65)
        elif 'readonly' in role_lower or 'viewer' in role_lower:
            privilege = max(privilege, 25)
        
        # Check attached policies for high privilege
        try:
            attached = self.iam.list_attached_role_policies(RoleName=role_name)
            for policy in attached.get('AttachedPolicies', []):
                policy_name = policy['PolicyName']
                if 'AdministratorAccess' in policy_name:
                    privilege = 100
                elif 'PowerUserAccess' in policy_name:
                    privilege = max(privilege, 85)
                elif 'FullAccess' in policy_name:
                    privilege = max(privilege, 75)
                elif 'IAMFullAccess' in policy_name or 'IAMManagement' in policy_name:
                    privilege = max(privilege, 90)
        except ClientError:
            pass
        
        return privilege
    
    def _calculate_policy_privilege(self, policy_arn: str) -> int:
        """Calculate privilege level for a policy (0-100)"""
        if 'AdministratorAccess' in policy_arn:
            return 100
        elif 'PowerUserAccess' in policy_arn:
            return 80
        elif 'ReadOnlyAccess' in policy_arn:
            return 20
        elif 'FullAccess' in policy_arn:
            return 70
        return 40
    
    def get_recent_events(self, hours: int = 24) -> list[dict]:
        """Get recent CloudTrail events for IAM actions"""
        events = []
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours)
            
            response = self.cloudtrail.lookup_events(
                LookupAttributes=[
                    {'AttributeKey': 'EventSource', 'AttributeValue': 'iam.amazonaws.com'}
                ],
                StartTime=start_time,
                EndTime=end_time,
                MaxResults=50
            )
            
            for event in response.get('Events', []):
                events.append({
                    "event_id": event.get('EventId'),
                    "event_name": event.get('EventName'),
                    "event_time": event.get('EventTime').isoformat() if event.get('EventTime') else None,
                    "username": event.get('Username'),
                    "resources": event.get('Resources', [])
                })
                metrics.record_event_processed()
                
        except ClientError as e:
            print(f"Error fetching CloudTrail events: {e}")
        
        return events
    
    def ingest_all(self) -> dict:
        """Full ingestion of all IAM entities"""
        # Check for simulation mode
        if os.getenv("USE_MOCK_DATA", "false").lower() == "true":
            return self.ingest_mock_data()

        results = {
            "users": self.ingest_users(),
            "roles": self.ingest_roles(),
            "groups": self.ingest_groups(),
            "policies": self.ingest_policies(),
            "total_nodes": identity_graph.node_count,
            "total_edges": identity_graph.edge_count
        }
        return results

    def ingest_mock_data(self) -> dict:
        """Ingest mock IAM data for development/testing (no AWS costs)"""
        print("Using mock data mode - no AWS API calls will be made")

        # Generate mock dataset
        mock_data = mock_data_generator.generate_full_dataset()

        # Ingest mock users
        user_count = self._ingest_mock_users(mock_data['users'])

        # Ingest mock roles
        role_count = self._ingest_mock_roles(mock_data['roles'])

        # Ingest mock groups
        group_count = self._ingest_mock_groups(mock_data['groups'], mock_data['group_memberships'])

        # Ingest mock policies
        policy_count = self._ingest_mock_policies(mock_data['policies'], mock_data['policy_attachments'])

        results = {
            "users": user_count,
            "roles": role_count,
            "groups": group_count,
            "policies": policy_count,
            "total_nodes": identity_graph.node_count,
            "total_edges": identity_graph.edge_count,
            "mode": "mock"
        }
        return results

    def _ingest_mock_users(self, users: list) -> int:
        """Ingest mock users into graph"""
        count = 0
        for user in users:
            node = IdentityNode(
                id=f"user:{user['UserName']}",
                node_type=NodeType.IAM_USER,
                name=user['UserName'],
                arn=user['Arn'],
                created_at=user.get('CreateDate', datetime.now()),
                privilege_level=self._calculate_user_privilege(user['UserName']),
                metadata={
                    "user_id": user['UserId'],
                    "path": user.get('Path', '/'),
                    "department": user.get('department', 'unknown')
                }
            )
            identity_graph.add_node(node)
            count += 1
        return count

    def _ingest_mock_roles(self, roles: list) -> int:
        """Ingest mock roles into graph"""
        count = 0
        for role in roles:
            node = IdentityNode(
                id=f"role:{role['RoleName']}",
                node_type=NodeType.IAM_ROLE,
                name=role['RoleName'],
                arn=role['Arn'],
                created_at=role.get('CreateDate', datetime.now()),
                privilege_level=role.get('privilege_level', self._calculate_role_privilege(role['RoleName'])),
                metadata={
                    "role_id": role['RoleId'],
                    "path": role.get('Path', '/'),
                    "assume_role_policy": role.get('AssumeRolePolicyDocument', {})
                }
            )
            identity_graph.add_node(node)
            count += 1

            # Add some mock assume role relationships
            if count <= 5:  # First few roles can be assumed by users
                for i in range(1, min(4, count + 1)):
                    user_id = f"user:employee_{i:03d}"
                    if identity_graph.get_node(user_id):
                        identity_graph.add_edge(user_id, f"role:{role['RoleName']}", EdgeType.CAN_ASSUME)

        return count

    def _ingest_mock_groups(self, groups: list, memberships: dict) -> int:
        """Ingest mock groups and memberships into graph"""
        count = 0
        for group in groups:
            node = IdentityNode(
                id=f"group:{group['GroupName']}",
                node_type=NodeType.IAM_GROUP,
                name=group['GroupName'],
                arn=group['Arn'],
                created_at=group.get('CreateDate', datetime.now()),
                metadata={
                    "group_id": group['GroupId'],
                    "path": group.get('Path', '/'),
                    "attached_policy": group.get('attached_policy', '')
                }
            )
            identity_graph.add_node(node)
            count += 1

            # Add group memberships
            group_members = memberships.get(group['GroupName'], [])
            for username in group_members:
                user_id = f"user:{username}"
                group_id = f"group:{group['GroupName']}"
                if identity_graph.get_node(user_id):
                    identity_graph.add_edge(user_id, group_id, EdgeType.MEMBER_OF)

        return count

    def _ingest_mock_policies(self, policies: list, attachments: dict) -> int:
        """Ingest mock policies and attachments into graph"""
        count = 0
        for policy in policies:
            node = IdentityNode(
                id=f"policy:{policy['PolicyName']}",
                node_type=NodeType.POLICY,
                name=policy['PolicyName'],
                arn=policy['Arn'],
                created_at=policy.get('CreateDate', datetime.now()),
                privilege_level=policy.get('privilege_level', self._calculate_policy_privilege(policy['Arn'])),
                metadata={
                    "policy_id": policy['PolicyId'],
                    "attachment_count": policy.get('AttachmentCount', 0)
                }
            )
            identity_graph.add_node(node)
            count += 1

        # Add policy attachments
        for entity_id, attached_policies in attachments.items():
            for policy in attached_policies:
                policy_id = f"policy:{policy['PolicyName']}"
                if identity_graph.get_node(entity_id) and identity_graph.get_node(policy_id):
                    identity_graph.add_edge(entity_id, policy_id, EdgeType.HAS_POLICY)

        return count

    def get_mock_events(self, hours: int = 24) -> list[dict]:
        """Get mock CloudTrail events (no AWS API calls)"""
        events = mock_data_generator.generate_cloudtrail_events(hours)
        for event in events:
            metrics.record_event_processed()
        return events


# Singleton instance
aws_ingester = AWSIngester()
