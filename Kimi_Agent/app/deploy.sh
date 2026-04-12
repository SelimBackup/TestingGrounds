#!/bin/bash

# Production Deployment Script for Presentation to Excel Quotation Generator
# This script sets up the application for production deployment

echo "=========================================="
echo "  Production Deployment Setup"
echo "=========================================="
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip install flask flask-cors python-pptx pdfplumber openpyxl gunicorn -q

# Create necessary directories
mkdir -p backend/uploads backend/outputs

echo ""
echo "=========================================="
echo "  Starting Production Server"
echo "=========================================="
echo ""

# Start with gunicorn for production
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
