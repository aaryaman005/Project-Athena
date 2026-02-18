"""
Project Athena - Cloud Identity Attack Path Detection Platform
Main FastAPI Application Entry Point
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
import time

from api.routes import router
from core.metrics import metrics

# Initialize FastAPI
app = FastAPI(
    title="Project Athena",
    description="Cloud Identity Attack Path Detection & Autonomous Response",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include API routes
app.include_router(router, prefix="/api")

# Root endpoint
@app.get("/")
def root():
    return {
        "name": "Project Athena",
        "description": "Cloud Identity Attack Path Detection Platform",
        "version": "1.0.0",
        "status": "operational"
    }

# Health check
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "athena-core",
        "uptime_seconds": int(time.time() - metrics.start_time)
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
