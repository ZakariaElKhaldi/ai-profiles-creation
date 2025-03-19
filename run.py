#!/usr/bin/env python
"""
Starter script for the AI Profiles API
Run this from the project root with: python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True) 