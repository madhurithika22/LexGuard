import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, contracts, chat

# Automatically initialize database tables (SQLite/PostgreSQL)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-grade AI contract audit, compliance, and negotiation platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(contracts.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "api_docs": "/docs",
        "fallback_db": settings.DATABASE_URL.startswith("sqlite")
    }
