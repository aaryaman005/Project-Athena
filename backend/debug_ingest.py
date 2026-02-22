import sys
import os
import traceback

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.aws_ingester import aws_ingester

try:
    print("Starting manual ingestion...")
    results = aws_ingester.ingest_all()
    print(f"Ingestion successful: {results}")
except Exception:
    print("Ingestion FAILED with traceback:")
    traceback.print_exc()
