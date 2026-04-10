#!/bin/bash

# Presentation to Excel Quotation Generator - Startup Script
# This script starts both the backend Flask API and the frontend development server

echo "=========================================="
echo "  Presentation to Excel Quotation Generator"
echo "=========================================="
echo ""

# Check if Python dependencies are installed
echo "Checking Python dependencies..."
pip show flask flask-cors python-pptx pdfplumber openpyxl > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Installing Python dependencies..."
    pip install flask flask-cors python-pptx pdfplumber openpyxl -q
fi

echo "Dependencies OK!"
echo ""

# Create necessary directories
mkdir -p backend/uploads backend/outputs

# Start the backend server in the background
echo "Starting Flask backend server on http://localhost:5000..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start the frontend development server
echo "Starting React frontend on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Services Started!"
echo "=========================================="
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:5000"
echo ""
echo "  Press Ctrl+C to stop both services"
echo "=========================================="
echo ""

# Handle shutdown
trap "echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Wait for both processes
wait
