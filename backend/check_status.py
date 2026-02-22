import requests

try:
    resp = requests.get("http://localhost:5000/health")
    print(f"Health: {resp.json()}")
    
    resp = requests.get("http://localhost:5000/api/graph/stats")
    print(f"Stats: {resp.json()}")
    
    resp = requests.get("http://localhost:5000/api/identities")
    print(f"Identities: {resp.json().get('count', 0)}")
except Exception as e:
    print(f"Error checking status: {e}")
