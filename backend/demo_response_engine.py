import urllib.request
import json

API_URL = "http://localhost:5000"

def get_request(endpoint):
    try:
        with urllib.request.urlopen(f"{API_URL}{endpoint}") as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"GET {endpoint} failed: {e}")
        return {}

def post_request(endpoint):
    req = urllib.request.Request(f"{API_URL}{endpoint}", method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"POST {endpoint} failed: {e}")
        return {}

print("=" * 60)
print("PROJECT ATHENA - RESPONSE ENGINE DEMO")
print("=" * 60)

# 1. Get alerts
print("\n📊 Step 1: Checking Attack Path Detections...")
alerts_data = get_request("/api/alerts")
alerts = alerts_data.get("alerts", [])
print(f"Total Alerts Detected: {len(alerts)}")

if alerts:
    # Show first critical alert
    for alert in alerts:
        if alert.get('severity') in ['CRITICAL', 'HIGH']:
            print(f"\n🚨 Sample Alert:")
            print(f"   Severity: {alert.get('severity', 'N/A')}")
            print(f"   Path: {alert.get('source', 'N/A')} → {alert.get('target', 'N/A')}")
            print(f"   Confidence: {alert.get('confidence_score', 0)}")
            break

# 2. Show pending response plans
print("\n🛡️ Step 2: Checking Auto-Generated Response Plans...")
response_data = get_request("/api/response/pending")
pending = response_data.get("pending", [])
print(f"Pending Plans: {len(pending)}")

if pending:
    plan = pending[0]
    print(f"\n📋 Response Plan: {plan.get('plan_id', 'N/A')}")
    print(f"   Status: {plan.get('status', 'N/A')}")
    print(f"   Actions: {len(plan.get('actions', []))}")
    
    for i, action in enumerate(plan.get('actions', [])[:3], 1):
        print(f"   {i}. {action.get('action_type', 'N/A')}: {action.get('target', 'N/A')}")
    
    # 3. Demonstrate approval and execution
    print(f"\n⚡ Step 3: Executing Response Plan (Simulation Mode)...")
    plan_id = plan.get('plan_id')
    
    if plan_id:
        approve_result = post_request(f"/api/response/approve/{plan_id}")
        print(f"   ✅ Approved: {approve_result.get('message', 'OK')}")
        
        execute_result = post_request(f"/api/response/execute/{plan_id}")
        print(f"   ⚙️ Executed: {execute_result.get('message', 'Done')}")
        
        if execute_result.get('actions_performed'):
            print(f"\n   Actions Performed:")
            for action in execute_result['actions_performed'][:3]:
                print(f"   - {action.get('action_type', 'N/A')}: {action.get('status', 'N/A')}")
else:
    print("   ℹ️  No pending plans (all may be approved/executed)")

print("\n" + "=" * 60)
print("✅ RESPONSE ENGINE STATUS")
print("=" * 60)
print(f"• {len(alerts)} attack paths detected")
print(f"• {len(pending)} response plans awaiting approval")
print("• Simulation Mode: Actions are logged (no real AWS changes)")
print("\nYou can now:")
print("1. View alerts in the frontend: http://localhost:5174")
print("2. Approve/reject plans via the Response controls")
print("3. Monitor execution in real-time")
