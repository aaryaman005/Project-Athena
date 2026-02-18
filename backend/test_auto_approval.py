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

print("=" * 70)
print("AUTO-APPROVAL VERIFICATION TEST")
print("=" * 70)

# 1. Get all alerts
print("\n📊 Step 1: Fetching All Alerts...")
alerts_data = get_request("/api/alerts")
alerts = alerts_data.get("alerts", [])
print(f"Total Alerts: {len(alerts)}")

# 2. Count auto-approved vs manual
if len(alerts) == 0:
    print("⚠️ No alerts detected yet. Waiting for scan...")
    exit(0)

auto_approved = [a for a in alerts if a.get('auto_response_eligible')]
manual_only = [a for a in alerts if not a.get('auto_response_eligible')]

print(f"\n✅ Auto-Approved: {len(auto_approved)} ({len(auto_approved)/len(alerts)*100:.1f}%)")
print(f"👤 Manual Approval Required: {len(manual_only)} ({len(manual_only)/len(alerts)*100:.1f}%)")

# 3. Breakdown by severity
from collections import defaultdict
auto_by_severity = defaultdict(int)
manual_by_severity = defaultdict(int)

for a in auto_approved:
    auto_by_severity[a.get('severity', 'unknown')] += 1
for a in manual_only:
    manual_by_severity[a.get('severity', 'unknown')] += 1

print("\n📈 Breakdown by Severity:")
for sev in ['critical', 'high', 'medium', 'low']:
    auto = auto_by_severity.get(sev, 0)
    manual = manual_by_severity.get(sev, 0)
    total = auto + manual
    if total > 0:
        print(f"  {sev.upper()}: {auto}/{total} auto-approved ({auto/total*100:.0f}%)")

# 4. Check pending manual approvals
print("\n🛡️ Step 2: Checking Pending Manual Approvals...")
response_data = get_request("/api/response/pending")
pending = response_data.get("pending", [])
print(f"Plans Awaiting Manual Approval: {len(pending)}")

# 5. Check already executed (auto-approved)
history_data = get_request("/api/response/history")
history = history_data.get("history", [])
auto_executed = [h for h in history if h.get('auto_approved')]
print(f"Auto-Executed Plans: {len(auto_executed)}")

print("\n" + "=" * 70)
print("✅ AUTOMATION IMPACT")
print("=" * 70)
print(f"Manual Work Reduced By: {len(auto_approved)/len(alerts)*100:.1f}%")
print(f"Alerts Requiring Human Review: {len(manual_only)}")
print(f"\nConfig: CRITICAL ≥ 0.90, HIGH ≥ 0.85 confidence")
