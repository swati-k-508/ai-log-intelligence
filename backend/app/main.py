import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .api.endpoints import router as api_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Universal Log Pre-processing Framework (ULPF) API",
    description="NTRO PS 26156 Prototype Backend - Heterogeneous Log Normalization & Anomaly Pipeline",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Universal Log Pre-processing Framework (ULPF)",
        "ps_id": "26156",
        "organization": "National Technical Research Organisation (NTRO)",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
