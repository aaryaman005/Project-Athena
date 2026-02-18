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

def trigger_update():
    print("Triggering Ingest...")
    res = post_request("/api/ingest/aws")
    print(f"Ingest Result: {res.get('status')}")
    
    print("Triggering Scan...")
    res = post_request("/api/detect/scan")
    print(f"Scan Result: Found {res.get('paths_detected')} paths")

if __name__ == "__main__":
    trigger_update()
