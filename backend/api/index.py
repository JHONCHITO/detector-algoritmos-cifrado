# backend/api/index.py

from backend.main import app as fastapi_app

# Vercel necesita una variable llamada "app"
app = fastapi_app
