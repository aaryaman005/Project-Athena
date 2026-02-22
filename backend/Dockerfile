# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r athena && useradd -r -g athena athena

# Copy installed packages from builder
COPY --from=builder /root/.local /home/athena/.local
COPY . .

# Set environment
ENV PATH=/home/athena/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Fix permissions
RUN chown -R athena:athena /app

USER athena

EXPOSE 5000

CMD ["python", "main.py"]
