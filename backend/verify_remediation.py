import boto3
import urllib.request
import json
import time

API_URL = "http://localhost:5000"

def post_request(endpoint):
    req = urllib.request.Request(f"{API_URL}{endpoint}", method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"POST {endpoint} failed: {e}")
        return {}

def get_request(endpoint):
    try:
        with urllib.request.urlopen(f"{API_URL}{endpoint}") as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"GET {endpoint} failed: {e}")
        return {}

def verify_remediation():
    target_user = "Mandy"
    print(f"Checking {target_user}...")
    client = boto3.client('iam')
    
    # 1. Ensure Mandy exists and has Login Profile + Access Key
    try:
        # Create user if needed
        try:
            client.create_user(UserName=target_user)
        except client.exceptions.EntityAlreadyExistsException:
            pass
            
        # Login Profile
        try:
            client.create_login_profile(UserName=target_user, Password='SecurePassword123!')
        except client.exceptions.EntityAlreadyExistsException:
            pass
        
        # Access Key (Delete existing first to keep it clean)
        keys = client.list_access_keys(UserName=target_user)
        for k in keys['AccessKeyMetadata']:
            client.delete_access_key(UserName=target_user, AccessKeyId=k['AccessKeyId'])
        
        # Create new ACTIVE key
        key_resp = client.create_access_key(UserName=target_user)
        access_key_id = key_resp['AccessKey']['AccessKeyId']
        print(f"Created new Active Access Key for {target_user}: {access_key_id}")
        
    except Exception as e:
        print(f"Setup failed: {e}")
        return

    print("Triggering Ingest & Scan...")
    post_request("/api/ingest/aws")
    post_request("/api/detect/scan")
    
    print("Fetching plans...")
    plans = get_request("/api/response/pending").get("pending", [])
    print(f"Found {len(plans)} plans.")
    
    # Approve and Execute ALL plans
    for plan in plans:
        pid = plan['plan_id']
        print(f"Executing {pid}...")
        post_request(f"/api/response/approve/{pid}")
        post_request(f"/api/response/execute/{pid}")

    print("Verifying Remediation...")
    
    # Check Access Keys
    keys = client.list_access_keys(UserName=target_user)
    active_keys = [k for k in keys['AccessKeyMetadata'] if k['Status'] == 'Active']
    if not active_keys:
        print(f"[SUCCESS] All Access Keys for {target_user} are INACTIVE/DELETED.")
    else:
        print(f"[FAIL] {target_user} still has ACTIVE keys: {active_keys}")

    # Check Revoke Sessions Policy
    policies = client.list_user_policies(UserName=target_user)
    revoke_policies = [p for p in policies['PolicyNames'] if 'RevokeSessions' in p]
    if revoke_policies:
        print(f"[SUCCESS] Found RevokeSessions policy on {target_user}: {revoke_policies}")
    else:
        print(f"[FAIL] No RevokeSessions policy found on {target_user}.")

    # Check Console Access
    try:
        client.get_login_profile(UserName=target_user)
        print(f"[INFO] {target_user} still has console access (might be expected if score < 0.95).")
    except client.exceptions.NoSuchEntityException:
        print(f"[SUCCESS] {target_user} console access DISABLED.")

if __name__ == "__main__":
    verify_remediation()
