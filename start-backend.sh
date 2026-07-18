#!/bin/bash

echo "Starting FastAPI Backend..."
echo "Press Ctrl+C to stop the server"
echo ""

cd backend
source venv/bin/activate
PYTHONPATH=. uvicorn main:app --reload
