"""
Project Athena - Prometheus Metrics
Centralized metrics collection for monitoring
"""
from prometheus_client import Counter, Histogram, Gauge
import time


class Metrics:
    """Prometheus metrics for Athena platform"""
    
    def __init__(self):
        self.start_time = time.time()
        
        # Counters
        self.events_processed = Counter(
            'athena_events_processed_total',
            'Total number of CloudTrail events processed'
        )
        self.attack_paths_detected = Counter(
            'athena_attack_paths_detected_total',
            'Total number of attack paths detected'
        )
        self.alerts_generated = Counter(
            'athena_alerts_generated_total',
            'Total number of alerts generated',
            ['severity']
        )
        self.responses_executed = Counter(
            'athena_responses_executed_total',
            'Total number of automated responses executed',
            ['action_type']
        )
        
        # Gauges
        self.active_identities = Gauge(
            'athena_active_identities',
            'Number of active IAM identities in graph',
            ['identity_type']
        )
        self.graph_nodes = Gauge(
            'athena_graph_nodes_total',
            'Total nodes in identity graph'
        )
        self.graph_edges = Gauge(
            'athena_graph_edges_total',
            'Total edges in identity graph'
        )
        
        # Histograms
        self.detection_latency = Histogram(
            'athena_detection_latency_seconds',
            'Time to detect attack paths',
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
        )
        self.response_latency = Histogram(
            'athena_response_latency_seconds',
            'Time to execute response actions',
            buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0]
        )
    
    def record_event_processed(self):
        self.events_processed.inc()
    
    def record_attack_path(self):
        self.attack_paths_detected.inc()
    
    def record_alert(self, severity: str):
        self.alerts_generated.labels(severity=severity).inc()
    
    def record_response(self, action_type: str):
        self.responses_executed.labels(action_type=action_type).inc()
    
    def set_identity_count(self, identity_type: str, count: int):
        self.active_identities.labels(identity_type=identity_type).set(count)
    
    def set_graph_size(self, nodes: int, edges: int):
        self.graph_nodes.set(nodes)
        self.graph_edges.set(edges)


# Singleton instance
metrics = Metrics()
