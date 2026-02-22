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

print("Fetching latest audit logs...")
data = get_request("/api/audit/logs")
logs = data.get("logs", [])

# Display last 10 logs
print(f"\nLast 10 Audit Logs (Total: {len(logs)}):")
for log in logs[-10:]:
    print(f"[{log['timestamp']}] {log['actor']} - {log['action']} - {log['status']} - {log['details']}")
