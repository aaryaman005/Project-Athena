"""
Project Athena - Attack Path Detection Engine
Graph-based privilege escalation detection using DFS
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum

from core.graph import identity_graph
from core.metrics import metrics


class Severity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AttackPath:
    """Represents a detected attack path"""
    path_id: str
    path: list[str]
    source_node: str
    target_node: str
    privilege_delta: int
    confidence_score: float
    blast_radius: int
    severity: Severity
    detected_at: datetime = field(default_factory=datetime.now)
    recommended_actions: list[str] = field(default_factory=list)
    auto_response_eligible: bool = False
    
    def to_dict(self) -> dict:
        return {
            "path_id": self.path_id,
            "path": self.path,
            "source_node": self.source_node,
            "target_node": self.target_node,
            "privilege_delta": self.privilege_delta,
            "confidence_score": self.confidence_score,
            "blast_radius": self.blast_radius,
            "severity": self.severity.value,
            "detected_at": self.detected_at.isoformat(),
            "recommended_actions": self.recommended_actions,
            "auto_response_eligible": self.auto_response_eligible
        }


class DetectionEngine:
    """
    Attack path detection using graph traversal.
    Detects privilege escalation paths in identity graph.
    """
    
    def __init__(self):
        self._detected_paths: list[AttackPath] = []
        self._path_counter = 0
    
    def find_escalation_paths(
        self,
        start_node: Optional[str] = None,
        min_privilege_delta: int = 20
    ) -> list[AttackPath]:
        """
        Find all privilege escalation paths from a starting node.
        If no start node specified, scan from all low-privilege nodes.
        """
        detected = []
        
        if start_node:
            # Scan from specific node
            paths = self._dfs_escalation(start_node, min_privilege_delta)
            detected.extend(paths)
        else:
            # Scan from all low-privilege nodes
            low_priv_nodes = self._get_low_privilege_nodes()
            for node_id in low_priv_nodes:
                paths = self._dfs_escalation(node_id, min_privilege_delta)
                detected.extend(paths)
        
        # Store and return
        self._detected_paths.extend(detected)
        return detected
    
    def _dfs_escalation(
        self,
        start_node: str,
        min_delta: int
    ) -> list[AttackPath]:
        """
        Depth-first search for escalation paths.
        Returns paths where privilege increases significantly.
        """
        paths = []
        start_privilege = identity_graph.get_privilege_level(start_node)
        
        visited = set()
        stack = [(start_node, [start_node], start_privilege)]
        
        while stack:
            node, path, current_priv = stack.pop()
            
            if node in visited:
                continue
            visited.add(node)
            
            # Get all reachable nodes
            neighbors = identity_graph.get_neighbors(node)
            
            for neighbor in neighbors:
                neighbor_priv = identity_graph.get_privilege_level(neighbor)
                delta = neighbor_priv - start_privilege
                
                # Check if this is an escalation
                if delta >= min_delta:
                    attack_path = self._create_attack_path(
                        path=path + [neighbor],
                        source_node=start_node,
                        target_node=neighbor,
                        privilege_delta=delta
                    )
                    paths.append(attack_path)
                    metrics.record_attack_path()
                
                # Continue DFS
                if neighbor not in visited:
                    stack.append((neighbor, path + [neighbor], neighbor_priv))
        
        return paths
    
    def _get_low_privilege_nodes(self, threshold: int = 50) -> list[str]:
        """Get all nodes with privilege level below threshold"""
        low_priv = []
        graph_data = identity_graph.to_dict()
        
        for node in graph_data['nodes']:
            if node.get('privilege_level', 0) < threshold:
                low_priv.append(node['id'])
        
        return low_priv
    
    def _create_attack_path(
        self,
        path: list[str],
        source_node: str,
        target_node: str,
        privilege_delta: int
    ) -> AttackPath:
        """Create an AttackPath object with scoring"""
        self._path_counter += 1
        path_id = f"AP-{self._path_counter:06d}"
        
        # Calculate confidence score
        confidence = self._calculate_confidence(path, privilege_delta)
        
        # Calculate blast radius
        blast_radius = self._calculate_blast_radius(target_node)
        
        # Determine severity
        severity = self._determine_severity(privilege_delta, confidence, blast_radius)
        
        # Generate recommended actions
        actions = self._generate_recommendations(path, severity)
        
        # Determine if auto-response eligible
        auto_eligible = self._is_auto_response_eligible(confidence, blast_radius, severity)
        
        # Record metrics
        metrics.record_alert(severity.value)
        
        path = AttackPath(
            path_id=path_id,
            path=path,
            source_node=source_node,
            target_node=target_node,
            privilege_delta=privilege_delta,
            confidence_score=confidence,
            blast_radius=blast_radius,
            severity=severity,
            recommended_actions=actions,
            auto_response_eligible=auto_eligible
        )

        # Automatically create response plan
        from core.response import response_engine
        response_engine.create_response_plan(path)
        
        return path
    
    def _calculate_confidence(self, path: list[str], privilege_delta: int) -> float:
        """
        Calculate confidence score (0.0 - 1.0) based on:
        - Path length (shorter = higher confidence)
        - Privilege delta magnitude
        - Edge types in path
        """
        # Base confidence from privilege delta
        delta_factor = min(privilege_delta / 100, 1.0) * 0.4
        
        # Path length factor (shorter paths = higher confidence)
        path_length = len(path)
        length_factor = max(0, (10 - path_length) / 10) * 0.3
        
        # Direct escalation bonus
        direct_bonus = 0.3 if path_length <= 2 else 0.1
        
        confidence = delta_factor + length_factor + direct_bonus
        return round(min(confidence, 1.0), 2)
    
    def _calculate_blast_radius(self, target_node: str) -> int:
        """
        Calculate blast radius: number of resources accessible from target.
        """
        # Count all nodes reachable from target
        reachable = set()
        stack = [target_node]
        
        while stack:
            node = stack.pop()
            if node in reachable:
                continue
            reachable.add(node)
            neighbors = identity_graph.get_neighbors(node)
            stack.extend(neighbors)
        
        return len(reachable)
    
    def _determine_severity(
        self,
        privilege_delta: int,
        confidence: float,
        blast_radius: int
    ) -> Severity:
        """Determine alert severity based on risk factors"""
        risk_score = (
            (privilege_delta / 100) * 0.4 +
            confidence * 0.3 +
            min(blast_radius / 50, 1.0) * 0.3
        )
        
        if risk_score >= 0.8:
            return Severity.CRITICAL
        elif risk_score >= 0.6:
            return Severity.HIGH
        elif risk_score >= 0.4:
            return Severity.MEDIUM
        else:
            return Severity.LOW
    
    def _generate_recommendations(
        self,
        path: list[str],
        severity: Severity
    ) -> list[str]:
        """Generate response recommendations based on path"""
        recommendations = []
        
        if severity in [Severity.CRITICAL, Severity.HIGH]:
            recommendations.append("Disable source identity immediately")
            recommendations.append("Detach all policies from source")
            recommendations.append("Rotate affected credentials")
        
        if severity == Severity.MEDIUM:
            recommendations.append("Review recent activity for source identity")
            recommendations.append("Consider restricting policy scope")
        
        if severity == Severity.LOW:
            recommendations.append("Monitor for repeated escalation attempts")
            recommendations.append("Audit policy attachments")
        
        # Add path-specific recommendations
        for node in path:
            if 'role:' in node:
                recommendations.append(f"Review trust policy for {node}")
            if 'policy:' in node:
                recommendations.append(f"Audit permissions in {node}")
        
        return recommendations[:5]  # Limit to 5 recommendations
    
    def _is_auto_response_eligible(
        self,
        confidence: float,
        blast_radius: int,
        severity: Severity
    ) -> bool:
        """
        Determine if attack path is eligible for automated response.
        Uses severity-based thresholds from config.
        """
        try:
            from config import AUTO_RESPONSE_CONFIG
            
            if not AUTO_RESPONSE_CONFIG.get("enabled", False):
                return False
            
            # Get thresholds for this severity level
            thresholds = AUTO_RESPONSE_CONFIG.get("severity_thresholds", {})
            min_confidence = thresholds.get(severity.value.upper())
            
            # If no threshold defined for this severity, require manual approval
            if min_confidence is None:
                return False
            
            # Check if confidence meets threshold
            return confidence >= min_confidence
            
        except ImportError:
            # Fallback if config not available: very conservative
            return severity == Severity.CRITICAL and confidence >= 0.95
    
    def get_all_alerts(self) -> list[dict]:
        """Get all detected attack paths"""
        return [p.to_dict() for p in self._detected_paths]
    
    def get_alert_by_id(self, path_id: str) -> Optional[dict]:
        """Get specific alert by ID"""
        for path in self._detected_paths:
            if path.path_id == path_id:
                return path.to_dict()
        return None
    
    def get_high_priority_alerts(self) -> list[dict]:
        """Get alerts that need immediate attention"""
        high_priority = [
            p for p in self._detected_paths
            if p.severity in [Severity.HIGH, Severity.CRITICAL]
        ]
        # Sort by confidence (highest first)
        high_priority.sort(key=lambda x: x.confidence_score, reverse=True)
        return [p.to_dict() for p in high_priority]


# Singleton instance
detection_engine = DetectionEngine()
