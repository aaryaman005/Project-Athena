import requests
import json

API_URL = "http://localhost:5000"

def verify():
    print("1. Logging in...")
    login_data = {"username": "admin", "password": "athena-admin-2026"}
    res = requests.post(f"{API_URL}/api/auth/login", data=login_data)
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    
    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    print("2. Triggering Ingest...")
    res = requests.post(f"{API_URL}/api/ingest/aws", headers=headers)
    print(f"Ingest Result: {res.json()}")

    print("3. Checking Stats...")
    res = requests.get(f"{API_URL}/api/graph/stats")
    print(f"Final Stats: {res.json()}")

if __name__ == "__main__":
    verify()
