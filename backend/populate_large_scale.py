import boto3
import json
from botocore.exceptions import ClientError

def create_large_scale_env():
    iam = boto3.client('iam')
    current_account = boto3.client('sts').get_caller_identity()['Account']
    
    # === 1. Create Groups & Policies ===
    groups = {
        'Engineering': 'PowerUserAccess',
        'DataScience': 'AmazonS3FullAccess',
        'Finance': 'job-function/Billing',
        'HR': 'ReadOnlyAccess',
        'Interns': 'ReadOnlyAccess',
        'Contractors': None # Custom
    }
    
    print("Creating Groups...")
    for group, policy in groups.items():
        try:
            iam.create_group(GroupName=group)
            if policy:
                iam.attach_group_policy(GroupName=group, PolicyArn=f"arn:aws:iam::aws:policy/{policy}")
        except ClientError:
            pass

    # Contractor Policy
    try:
        contractor_policy = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": ["s3:GetObject", "s3:ListBucket"], "Resource": "*"}]
        }
        resp = iam.create_policy(PolicyName='RestrictedContractor', PolicyDocument=json.dumps(contractor_policy))
        iam.attach_group_policy(GroupName='Contractors', PolicyArn=resp['Policy']['Arn'])
    except ClientError:
        pass

    # === 2. Create 100 Users ===
    print("Creating 100 Users...")
    # Distribution
    # 0-39: Engineering
    # 40-54: DataScience
    # 55-64: Finance
    # 65-74: HR
    # 75-89: Interns
    # 90-99: Contractors
    
    for i in range(1, 101):
        username = f"employee_{i:03d}"
        
        # Determine Group
        group = 'Contractors'
        if i <= 40:
            group = 'Engineering'
        elif i <= 55:
            group = 'DataScience'
        elif i <= 65:
            group = 'Finance'
        elif i <= 75:
            group = 'HR'
        elif i <= 90:
            group = 'Interns'

        try:
            iam.create_user(UserName=username)
            iam.create_login_profile(UserName=username, Password='SecurePassword123!')
            iam.add_user_to_group(GroupName=group, UserName=username)
            if i % 10 == 0:
                print(f"Created {username} -> {group}")
        except ClientError:
            pass

    # === 3. Attack Paths ===
    print("Creating Attack Paths...")

    # Path A: Intern Chain (Intern -> MaintenanceRole -> ProdEC2Admin)
    try:
        # Maintenance Role
        trust_intern = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": {"AWS": f"arn:aws:iam::{current_account}:user/employee_080"}, "Action": "sts:AssumeRole"}]
        }
        iam.create_role(RoleName='MaintenanceRole', AssumeRolePolicyDocument=json.dumps(trust_intern))
        
        # Maintenance Permissions (PassRole)
        maint_policy = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": ["ec2:RunInstances", "iam:PassRole"], "Resource": "*"}]
        }
        iam.put_role_policy(RoleName='MaintenanceRole', PolicyName='MaintenancePrivs', PolicyDocument=json.dumps(maint_policy))
        
        # Target Role (ProdEC2Admin) assumes by EC2
        trust_ec2 = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
        }
        iam.create_role(RoleName='ProdEC2Admin', AssumeRolePolicyDocument=json.dumps(trust_ec2))
        iam.attach_role_policy(RoleName='ProdEC2Admin', PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess')
        
        print("Created Intern Chain (employee_080)")
    except ClientError as e:
        print(f"Path A Error: {e}")

    # Path B: Data Science Lead (Policy Edit)
    try:
        iam.create_user(UserName='data_lead')
        iam.create_login_profile(UserName='data_lead', Password='SecurePassword123!')
        
        # Target Policy attached to Admin
        target_policy_doc = {"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "s3:*", "Resource": "*"}]}
        p_resp = iam.create_policy(PolicyName='DS_Internal_Policy', PolicyDocument=json.dumps(target_policy_doc))
        target_arn = p_resp['Policy']['Arn']
        
        # Admin Role using this policy
        trust_root = {
            "Version": "2012-10-17", 
            "Statement": [{"Effect": "Allow", "Principal": {"AWS": f"arn:aws:iam::{current_account}:root"}, "Action": "sts:AssumeRole"}]
        }
        iam.create_role(RoleName='DS_Admin_Role', AssumeRolePolicyDocument=json.dumps(trust_root))
        iam.attach_role_policy(RoleName='DS_Admin_Role', PolicyArn=target_arn)
        
        # User Permission to Edit Policy
        edit_policy = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": ["iam:CreatePolicyVersion", "iam:SetDefaultPolicyVersion"], "Resource": target_arn}]
        }
        iam.put_user_policy(UserName='data_lead', PolicyName='EditPolicyPrivs', PolicyDocument=json.dumps(edit_policy))
        
        print("Created Data Science Chain (data_lead)")
    except ClientError as e:
         print(f"Path B Error: {e}")

    # Path C: Vendor Trust (Missing ExternalID)
    try:
        trust_vendor = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": {"AWS": "arn:aws:iam::123456789012:root"}, "Action": "sts:AssumeRole"}]
        }
        iam.create_role(RoleName='VendorAuditRole', AssumeRolePolicyDocument=json.dumps(trust_vendor))
        iam.attach_role_policy(RoleName='VendorAuditRole', PolicyArn='arn:aws:iam::aws:policy/SecurityAudit')
        print("Created Vendor Chain")
    except ClientError:
        pass

    print("Population Complete.")

if __name__ == "__main__":
    create_large_scale_env()
