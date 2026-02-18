"""
Project Athena - Identity Graph Engine
NetworkX-based directed graph for modeling IAM relationships
"""
import networkx as nx
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime

from core.metrics import metrics


class NodeType(Enum):
    """Types of nodes in the identity graph"""
    IAM_USER = "iam_user"
    IAM_ROLE = "iam_role"
    IAM_GROUP = "iam_group"
    POLICY = "policy"
    PERMISSION = "permission"
    RESOURCE = "resource"


class EdgeType(Enum):
    """Types of relationships between nodes"""
    CAN_ASSUME = "can_assume"           # User/Role → Role
    HAS_POLICY = "has_policy"           # User/Role/Group → Policy
    MEMBER_OF = "member_of"             # User → Group
    GRANTS_PERMISSION = "grants"        # Policy → Permission
    ACCESSES_RESOURCE = "accesses"      # Permission → Resource
    CAN_MODIFY = "can_modify"           # Identity → Policy/Role


@dataclass
class IdentityNode:
    """Represents a node in the identity graph"""
    id: str
    node_type: NodeType
    name: str
    arn: str
    created_at: datetime = field(default_factory=datetime.now)
    privilege_level: int = 0  # 0-100, higher = more privileged
    metadata: dict = field(default_factory=dict)


class IdentityGraph:
    """
    Directed graph representing cloud identity relationships.
    Used for attack path detection via graph traversal.
    """
    
    def __init__(self):
        self.graph = nx.DiGraph()
        self._node_cache: dict[str, IdentityNode] = {}
    
    def add_node(self, node: IdentityNode) -> None:
        """Add an identity node to the graph"""
        self.graph.add_node(
            node.id,
            node_type=node.node_type.value,
            name=node.name,
            arn=node.arn,
            privilege_level=node.privilege_level,
            created_at=node.created_at.isoformat(),
            metadata=node.metadata
        )
        self._node_cache[node.id] = node
        self._update_metrics()
    
    def add_edge(self, source_id: str, target_id: str, edge_type: EdgeType) -> None:
        """Add a directed edge (relationship) between nodes"""
        if source_id in self.graph and target_id in self.graph:
            self.graph.add_edge(
                source_id,
                target_id,
                edge_type=edge_type.value,
                created_at=datetime.now().isoformat()
            )
            self._update_metrics()
    
    def get_node(self, node_id: str) -> Optional[dict]:
        """Get node data by ID"""
        if node_id in self.graph:
            return dict(self.graph.nodes[node_id])
        return None
    
    def get_neighbors(self, node_id: str) -> list[str]:
        """Get all nodes that this node can reach"""
        if node_id in self.graph:
            return list(self.graph.successors(node_id))
        return []
    
    def get_predecessors(self, node_id: str) -> list[str]:
        """Get all nodes that can reach this node"""
        if node_id in self.graph:
            return list(self.graph.predecessors(node_id))
        return []
    
    def find_paths(self, source_id: str, target_id: str, max_depth: int = 10) -> list[list[str]]:
        """Find all paths from source to target (for attack path detection)"""
        try:
            paths = list(nx.all_simple_paths(
                self.graph, source_id, target_id, cutoff=max_depth
            ))
            return paths
        except nx.NetworkXError:
            return []
    
    def get_privilege_level(self, node_id: str) -> int:
        """Get the privilege level of a node"""
        node = self.get_node(node_id)
        return node.get('privilege_level', 0) if node else 0
    
    def to_dict(self) -> dict:
        """Export graph as dictionary for API response"""
        nodes = []
        for node_id in self.graph.nodes:
            node_data = self.graph.nodes[node_id]
            nodes.append({
                "id": node_id,
                "type": node_data.get("node_type"),
                "name": node_data.get("name"),
                "arn": node_data.get("arn"),
                "privilege_level": node_data.get("privilege_level", 0)
            })
        
        edges = []
        for source, target in self.graph.edges:
            edge_data = self.graph.edges[source, target]
            edges.append({
                "source": source,
                "target": target,
                "edge_type": edge_data.get("edge_type")
            })
        
        return {"nodes": nodes, "edges": edges}
    
    def _update_metrics(self) -> None:
        """Update Prometheus metrics for graph size"""
        metrics.set_graph_size(
            nodes=self.graph.number_of_nodes(),
            edges=self.graph.number_of_edges()
        )
        
        # Count by node type
        type_counts = {}
        for node_id in self.graph.nodes:
            node_type = self.graph.nodes[node_id].get("node_type", "unknown")
            type_counts[node_type] = type_counts.get(node_type, 0) + 1
        
        for identity_type, count in type_counts.items():
            metrics.set_identity_count(identity_type, count)
    
    @property
    def node_count(self) -> int:
        return self.graph.number_of_nodes()
    
    @property
    def edge_count(self) -> int:
        return self.graph.number_of_edges()


# Singleton instance
identity_graph = IdentityGraph()
