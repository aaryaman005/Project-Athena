import boto3
import json
import random
import time
from botocore.exceptions import ClientError

def create_iam_resources():
    iam = boto3.client('iam')
    
    # 1. Create Groups
    groups = {
        'Developers': 'PowerUserAccess',
        'SecurityAnalysts': 'SecurityAudit',
        'BillingManagers': 'Billing',
        'Interns': 'ReadOnlyAccess',
        'DevOps': None # Will get custom policy
    }
    
    print("Creating Groups...")
    for group_name, policy in groups.items():
        try:
            iam.create_group(GroupName=group_name)
            print(f"Created group: {group_name}")
            if policy:
                iam.attach_group_policy(
                    GroupName=group_name,
                    PolicyArn=f"arn:aws:iam::aws:policy/{policy}"
                )
        except ClientError as e:
            if e.response['Error']['Code'] != 'EntityAlreadyExists':
                print(f"Error creating group {group_name}: {e}")

    # 2. Create Custom Policies
    policies = {
        'DevOpsPolicy': {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["iam:PassRole", "ec2:*", "lambda:*"],
                    "Resource": "*"
                }
            ]
        },
        'S3AdminPolicy': {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:*",
                    "Resource": "*"
                }
            ]
        },
        'ShadowAdminPolicy': {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreatePolicy",
                        "iam:CreateLoginProfile",
                        "iam:AttachUserPolicy"
                    ],
                    "Resource": "*"
                }
            ]
        }
    }
    
    created_policies = {}
    print("\nCreating Customer Managed Policies...")
    account_id = boto3.client('sts').get_caller_identity()['Account']
    
    for name, doc in policies.items():
        try:
            resp = iam.create_policy(
                PolicyName=name,
                PolicyDocument=json.dumps(doc)
            )
            created_policies[name] = resp['Policy']['Arn']
            print(f"Created policy: {name}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'EntityAlreadyExists':
                created_policies[name] = f"arn:aws:iam::{account_id}:policy/{name}"
            else:
                print(f"Error creating policy {name}: {e}")

    # Attach custom policy to DevOps group
    try:
        iam.attach_group_policy(
            GroupName='DevOps',
            PolicyArn=created_policies['DevOpsPolicy']
        )
    except Exception as e:
        print(f"Error attaching DevOps policy: {e}")

    # 3. Create Users
    users = [
        ('dev_alice', 'Developers'),
        ('dev_bob', 'Developers'),
        ('dev_charlie', 'Developers'),
        ('sec_dave', 'SecurityAnalysts'),
        ('sec_eve', 'SecurityAnalysts'),
        ('bill_frank', 'BillingManagers'),
        ('intern_grace', 'Interns'),
        ('intern_heidi', 'Interns'),
        ('ops_ivan', 'DevOps'),
        ('shadow_judy', None) # No group, direct dangerous policy
    ]
    
    print("\nCreating Users...")
    for username, group_name in users:
        try:
            iam.create_user(UserName=username)
            iam.create_login_profile(UserName=username, Password='SecurePassword123!')
            print(f"Created user: {username}")
            
            if group_name:
                iam.add_user_to_group(GroupName=group_name, UserName=username)
            
            # Add some direct policies for flavor
            if username == 'shadow_judy':
                iam.attach_user_policy(UserName=username, PolicyArn=created_policies['ShadowAdminPolicy'])
                
        except ClientError as e:
            if e.response['Error']['Code'] != 'EntityAlreadyExists':
                print(f"Error creating user {username}: {e}")

    # 4. Create Roles with Trust Relationships (ESCALATION PATHS)
    print("\nCreating Roles...")
    
    # Path 1: Developer -> Assume -> EC2Admin
    ec2_trust = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": f"arn:aws:iam::{account_id}:user/dev_alice"},
                "Action": "sts:AssumeRole"
            }
        ]
    }
    try:
        iam.create_role(RoleName='EC2AdminRole', AssumeRolePolicyDocument=json.dumps(ec2_trust))
        iam.attach_role_policy(RoleName='EC2AdminRole', PolicyArn='arn:aws:iam::aws:policy/AmazonEC2FullAccess')
        print("Created EC2AdminRole (Assumable by dev_alice)")
    except ClientError:
        pass

    # Path 2: DevOps -> PassRole -> LambdaExec -> Admin
    # (LambdaExec role has AdministratorAccess - bad practice!)
    lambda_trust = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            },
            {
                "Effect": "Allow",
                "Principal": {"AWS": f"arn:aws:iam::{account_id}:user/ops_ivan"},
                "Action": "sts:AssumeRole"
            }
        ]
    }
    try:
        iam.create_role(RoleName='LambdaPrivEscRole', AssumeRolePolicyDocument=json.dumps(lambda_trust))
        iam.attach_role_policy(RoleName='LambdaPrivEscRole', PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess')
        print("Created LambdaPrivEscRole (Assumable by ops_ivan + Lambda)")
    except ClientError:
        pass

    print("\nPopulation Complete!")

if __name__ == "__main__":
    create_iam_resources()
