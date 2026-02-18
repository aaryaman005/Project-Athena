# Project Athena

**Cloud Identity Attack Path Detection & Autonomous Response Platform**

Athena models cloud identity relationships as graphs to detect privilege escalation attack paths and executes cost-aware autonomous incident response actions when confidence and blast radius thresholds are satisfied.

## Architecture

```
Cloud Audit Logs (AWS CloudTrail)
        ↓
Identity Attack Path Detection Engine
        ↓
Attack Graph + Risk Score
        ↓
Autonomous SOC Response Engine
        ↓
Containment / Mitigation / Alert
```

## Features

- **Identity Graph**: NetworkX-based directed graph modeling IAM relationships
- **Attack Path Detection**: DFS-based privilege escalation detection
- **Risk Scoring**: Confidence-based scoring with blast radius analysis
- **Autonomous Response**: Safe, reversible automated containment
- **Human-in-the-Loop**: High-risk actions require approval
- **Prometheus Metrics**: Production-ready observability
- **Live AWS Data**: Real IAM/CloudTrail integration via Boto3

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11 + FastAPI |
| Graph Engine | NetworkX |
| Metrics | Prometheus |
| AWS Integration | Boto3 |
| Frontend | React + TypeScript |

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API available at: http://localhost:8000
Docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/graph` | Get identity graph |
| GET | `/api/identities` | List IAM entities |
| POST | `/api/ingest/aws` | Ingest live AWS data |
| POST | `/api/detect/scan` | Scan for attack paths |
| GET | `/api/alerts` | Get detected alerts |
| POST | `/api/response/execute/{id}` | Execute response |

## Project Structure

```
Project-Athena/
├── backend/
│   ├── main.py              # FastAPI entry
│   ├── requirements.txt
│   ├── core/
│   │   ├── graph.py         # Identity graph
│   │   ├── detection.py     # Attack detection
│   │   ├── response.py      # Response engine
│   │   ├── aws_ingester.py  # AWS integration
│   │   └── metrics.py       # Prometheus
│   └── api/
│       └── routes.py        # API endpoints
└── frontend/                # React dashboard
```

## License

MIT
