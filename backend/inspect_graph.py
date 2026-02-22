import requests

BASE_URL = "http://localhost:5000/api"

def get_graph():
    resp = requests.get(f"{BASE_URL}/graph")
    return resp.json()

def get_identities():
    resp = requests.get(f"{BASE_URL}/identities")
    return resp.json()

graph = get_graph()
print(f"Nodes: {len(graph['nodes'])}")
print(f"Edges: {len(graph['edges'])}")

# Nodes of interest
interest = ["user:employee_076", "role:MaintenanceRole", "role:ProdEC2Admin"]
found = [n for n in graph['nodes'] if n['id'] in interest]
for n in found:
    print(f"Found node: {n['id']} (Priv: {n.get('privilege_level', 'N/A')})")

# Edges of interest
print("\nEdges involving interest nodes:")
for e in graph['edges']:
    if any(i == e['source'] or i == e['target'] for i in interest):
        print(f"  {e['source']} --[{e['edge_type']}]--> {e['target']}")

# Check if any CAN_ASSUME edges exist at all
can_assume = [e for e in graph['edges'] if e['edge_type'] == 'can_assume']
print(f"\nTotal 'can_assume' edges in graph: {len(can_assume)}")
for e in can_assume[:5]:
    print(f"  Example: {e['source']} -> {e['target']}")
