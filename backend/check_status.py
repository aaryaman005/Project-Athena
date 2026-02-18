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

# 1. Check Alerts
print("=== DETECTED ATTACK PATHS ===")
alerts_data = get_request("/api/alerts")
alerts = alerts_data.get("alerts", [])
print(f"Total Alerts: {len(alerts)}")
if alerts:
    for i, alert in enumerate(alerts[:3], 1):  # Show first 3
        print(f"\n{i}. {alert.get('alert_id')}")
        print(f"   Severity: {alert.get('severity')}")
        print(f"   Path: {alert.get('source')} -> {alert.get('target')}")
        print(f"   Confidence: {alert.get('confidence_score')}")

# 2. Check Pending Response Plans
print("\n\n=== PENDING RESPONSE PLANS ===")
response_data = get_request("/api/response/pending")
pending = response_data.get("pending", [])
print(f"Total Pending Plans: {len(pending)}")
if pending:
    for i, plan in enumerate(pending[:3], 1):  # Show first 3
        print(f"\n{i}. Plan ID: {plan.get('plan_id')}")
        print(f"   Status: {plan.get('status')}")
        print(f"   Actions: {len(plan.get('actions', []))}")
        for action in plan.get('actions', [])[:2]:  # Show first 2 actions
            print(f"   - {action.get('action_type')}: {action.get('target')}")

# 3. Graph Stats
print("\n\n=== GRAPH STATISTICS ===")
stats = get_request("/api/graph/stats")
print(f"Total Nodes: {stats.get('total_nodes')}")
print(f"Total Edges: {stats.get('total_edges')}")

print("\n✅ Response Engine is ready for testing!")
