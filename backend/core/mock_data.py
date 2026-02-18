"""
Project Athena - Mock AWS IAM Data Generator
Generates simulated AWS IAM data for development/testing without API costs
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any




class MockDataGenerator:
    """
    Generates realistic mock AWS IAM data for development and testing.
    Avoids API calls and associated costs while maintaining data structure.
    """

    def __init__(self, seed: int = 42):
        random.seed(seed)
        self.base_date = datetime.now() - timedelta(days=365)

    def generate_users(self, count: int = 100) -> List[Dict[str, Any]]:
        """Generate mock IAM users"""
        users = []
        departments = ['engineering', 'data_science', 'finance', 'hr', 'interns', 'contractors']
        
        for i in range(count):
            dept = departments[i % len(departments)] # Deterministic distribution
            user_id = f"employee_{i+1:03d}"
            created_date = self.base_date + timedelta(days=random.randint(0, 365))
            
            user = {
                'UserName': user_id,
                'UserId': f'AIDACKCEVSQ6C2EXAMPLE{i+1:03d}',
                'Arn': f'arn:aws:iam::123456789012:user/employees/{user_id}',
                'CreateDate': created_date,
                'Path': '/employees/',
                'department': dept
            }
            users.append(user)
            
            # Specific users for attack paths (override props)
            if i == 80: # employee_081 -> Intern attack path
                user['department'] = 'interns'
            if i == 50: # employee_051 -> Data Lead
                user['UserName'] = 'data_lead'
                user['department'] = 'data_science'

        return users

    def generate_roles(self, count: int = 20) -> List[Dict[str, Any]]:
        """Generate mock IAM roles including vulnerable ones"""
        roles = []
        role_templates = [
            ('AdminRole', 'AdministratorAccess', 100),
            ('PowerUserRole', 'PowerUserAccess', 85),
            ('DeveloperRole', 'ReadOnlyAccess', 25),
            ('AuditorRole', 'SecurityAudit', 65),
            ('BillingRole', 'Billing', 60),
            ('DataEngineerRole', 'AmazonS3FullAccess', 70),
            ('ReadOnlyRole', 'ReadOnlyAccess', 20),
        ]
        
        # Standard Roles
        for i in range(count):
            template = random.choice(role_templates)
            role_name = f"{template[0]}_{i+1:02d}"
            
            role = {
                'RoleName': role_name,
                'RoleId': f'AROAACKCEVSQ6C2EXAMPLE{i+1:03d}',
                'Arn': f'arn:aws:iam::123456789012:role/{role_name}',
                'CreateDate': self.base_date,
                'Path': '/',
                'AssumeRolePolicyDocument': {
                    'Version': '2012-10-17',
                    'Statement': [{'Effect': 'Allow', 'Principal': {'AWS': 'arn:aws:iam::123456789012:root'}, 'Action': 'sts:AssumeRole'}]
                },
                'privilege_level': template[2]
            }
            roles.append(role)

        # === Vulnerable Roles for Attack Paths ===
        
        # Path A: Maintenance Role (PassRole escalation)
        roles.append({
            'RoleName': 'MaintenanceRole',
            'RoleId': 'AROA_MAINTENANCE_123',
            'Arn': 'arn:aws:iam::123456789012:role/MaintenanceRole',
            'CreateDate': self.base_date,
            'Path': '/',
            'AssumeRolePolicyDocument': {
                'Version': '2012-10-17',
                'Statement': [{'Effect': 'Allow', 'Principal': {'AWS': 'arn:aws:iam::123456789012:user/employees/employee_081'}, 'Action': 'sts:AssumeRole'}]
            },
            'privilege_level': 50 # Seems low but has PassRole
        })

        # Path A: ProdEC2Admin (Target)
        roles.append({
            'RoleName': 'ProdEC2Admin',
            'RoleId': 'AROA_PROD_ADMIN_999',
            'Arn': 'arn:aws:iam::123456789012:role/ProdEC2Admin',
            'CreateDate': self.base_date,
            'Path': '/',
            'AssumeRolePolicyDocument': {
                'Version': '2012-10-17',
                'Statement': [{'Effect': 'Allow', 'Principal': {'Service': 'ec2.amazonaws.com'}, 'Action': 'sts:AssumeRole'}]
            },
            'privilege_level': 100
        })

        # Path B: Analytics Admin (Target for Policy Edit)
        roles.append({
            'RoleName': 'AnalyticsAdmin',
            'RoleId': 'AROA_ANALYTICS_ADMIN',
            'Arn': 'arn:aws:iam::123456789012:role/AnalyticsAdmin',
            'CreateDate': self.base_date,
            'Path': '/',
            'AssumeRolePolicyDocument': {'Version': '2012-10-17', 'Statement': [{'Effect': 'Allow', 'Principal': {'AWS': 'arn:aws:iam::123456789012:root'}, 'Action': 'sts:AssumeRole'}]},
            'privilege_level': 90
        })

        # Path C: Vendor Audit Role (External ID missing)
        roles.append({
            'RoleName': 'VendorAuditRole',
            'RoleId': 'AROA_VENDOR_AUDIT',
            'Arn': 'arn:aws:iam::123456789012:role/VendorAuditRole',
            'CreateDate': self.base_date,
            'Path': '/',
            'AssumeRolePolicyDocument': {
                'Version': '2012-10-17',
                'Statement': [{'Effect': 'Allow', 'Principal': {'AWS': 'arn:aws:iam::999999999999:root'}, 'Action': 'sts:AssumeRole'}] # No ExternalId
            },
            'privilege_level': 60
        })

        return roles

    def generate_groups(self, count: int = 6) -> List[Dict[str, Any]]:
        """Generate mock IAM groups"""
        groups = []
        group_data = [
            ('Engineering', 'PowerUserAccess'),
            ('DataScience', 'AmazonS3FullAccess'),
            ('Finance', 'job-function/Billing'),
            ('HR', 'ReadOnlyAccess'),
            ('Interns', 'ReadOnlyAccess'),
            ('Contractors', 'RestrictedContractorPolicy'),
        ]

        for i, (name, policy) in enumerate(group_data):
            group = {
                'GroupName': name,
                'GroupId': f'AGPAACKCEVSQ6C2EXAMPLE{i+1:03d}',
                'Arn': f'arn:aws:iam::123456789012:group/{name}',
                'CreateDate': self.base_date,
                'Path': '/',
                'attached_policy': policy
            }
            groups.append(group)
        return groups

    def generate_policies(self, count: int = 10) -> List[Dict[str, Any]]:
        """Generate mock IAM policies"""
        policies = []
        policy_templates = [
            ('AdministratorAccess', 100, 'arn:aws:iam::aws:policy/AdministratorAccess'),
            ('PowerUserAccess', 80, 'arn:aws:iam::aws:policy/PowerUserAccess'),
            ('ReadOnlyAccess', 20, 'arn:aws:iam::aws:policy/ReadOnlyAccess'),
            ('AmazonS3FullAccess', 70, 'arn:aws:iam::aws:policy/AmazonS3FullAccess'),
            ('SecurityAudit', 65, 'arn:aws:iam::aws:policy/SecurityAudit'),
            ('Billing', 60, 'arn:aws:iam::aws:policy/job-function/Billing'),
            ('RestrictedContractorPolicy', 30, 'arn:aws:iam::123456789012:policy/RestrictedContractorPolicy'),
            ('DataScienceCustomPolicy', 50, 'arn:aws:iam::123456789012:policy/DataScienceCustomPolicy'),
        ]

        for i, (name, privilege, arn) in enumerate(policy_templates):
            policy = {
                'PolicyName': name,
                'PolicyId': f'ANPAACKCEVSQ6C2EXAMPLE{i+1:03d}',
                'Arn': arn,
                'CreateDate': self.base_date,
                'AttachmentCount': random.randint(1, 20),
                'privilege_level': privilege
            }
            policies.append(policy)
        return policies

    def generate_group_memberships(self, users: List[Dict], groups: List[Dict]) -> Dict[str, List[str]]:
        """Generate realistic group memberships"""
        memberships = {}
        for group in groups:
            memberships[group['GroupName']] = []

        for user in users:
            dept = user.get('department')
            # Map departments to groups
            group_name = None
            if dept == 'engineering':
                group_name = 'Engineering'
            elif dept == 'data_science':
                group_name = 'DataScience'
            elif dept == 'finance':
                group_name = 'Finance'
            elif dept == 'hr':
                group_name = 'HR'
            elif dept == 'interns':
                group_name = 'Interns'
            elif dept == 'contractors':
                group_name = 'Contractors'
            
            if group_name and group_name in memberships:
                memberships[group_name].append(user['UserName'])

        return memberships

    def generate_attached_policies(self, users: List[Dict], roles: List[Dict], groups: List[Dict]) -> Dict[str, List[Dict]]:
        """Generate policy attachments for users, roles, and groups"""
        attachments = {}

        # 1. Group Policies (Standard)
        group_policies = {
            'Engineering': [{'PolicyName': 'PowerUserAccess', 'PolicyArn': 'arn:aws:iam::aws:policy/PowerUserAccess'}],
            'DataScience': [{'PolicyName': 'AmazonS3FullAccess', 'PolicyArn': 'arn:aws:iam::aws:policy/AmazonS3FullAccess'}],
            'Finance': [{'PolicyName': 'Billing', 'PolicyArn': 'arn:aws:iam::aws:policy/job-function/Billing'}],
            'HR': [{'PolicyName': 'ReadOnlyAccess', 'PolicyArn': 'arn:aws:iam::aws:policy/ReadOnlyAccess'}],
            'Interns': [{'PolicyName': 'ReadOnlyAccess', 'PolicyArn': 'arn:aws:iam::aws:policy/ReadOnlyAccess'}],
            'Contractors': [{'PolicyName': 'RestrictedContractorPolicy', 'PolicyArn': 'arn:aws:iam::123456789012:policy/RestrictedContractorPolicy'}],
        }
        for group in groups:
            attachments[f"group:{group['GroupName']}"] = group_policies.get(group['GroupName'], [])

        # 2. Role Policies (Standard + Attack Path Specifics)
        for role in roles:
            role_name = role['RoleName']
            role_key = f"role:{role_name}"
            pols = []
            
            if role_name == 'ProdEC2Admin':
                pols.append({'PolicyName': 'AdministratorAccess'})
            elif role_name == 'AnalyticsAdmin':
                pols.append({'PolicyName': 'DataScienceCustomPolicy'})
            elif role_name == 'VendorAuditRole':
                pols.append({'PolicyName': 'SecurityAudit'})
            elif 'Admin' in role_name:
                pols.append({'PolicyName': 'AdministratorAccess'})
            elif 'PowerUser' in role_name:
                pols.append({'PolicyName': 'PowerUserAccess'})
            elif 'ReadOnly' in role_name:
                pols.append({'PolicyName': 'ReadOnlyAccess'})
            
            attachments[role_key] = pols

        # 3. User Policies (Specific Escalations)
        for user in users:
            user_key = f"user:{user['UserName']}"
            pols = []
            
            if user['UserName'] == 'data_lead':
                # Grants permission to edit policies (mocked as a permission/edge separate, but policy helps viz)
                pols.append({'PolicyName': 'IAMPagePolicyEditMock'}) 
            
            attachments[user_key] = pols

        return attachments

    def generate_full_dataset(self) -> Dict[str, Any]:
        """Generate a complete mock AWS IAM dataset"""
        users = self.generate_users(100)
        roles = self.generate_roles(20)
        groups = self.generate_groups()
        policies = self.generate_policies()

        memberships = self.generate_group_memberships(users, groups)
        attachments = self.generate_attached_policies(users, roles, groups)

        return {
            'users': users,
            'roles': roles,
            'groups': groups,
            'policies': policies,
            'group_memberships': memberships,
            'policy_attachments': attachments,
            'generated_at': datetime.now().isoformat()
        }

# Singleton instance
mock_data_generator = MockDataGenerator()
