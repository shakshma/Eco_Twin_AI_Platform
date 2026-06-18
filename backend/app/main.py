from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.user import Base
from app.models.db import engine
from app.api import auth, footprint, analytics
from app.ml.train import train_footprint_model
import os

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Auto-train the ML model if it doesn't exist yet
model_path = os.path.join("app", "ml", "footprint_model.pkl")
if not os.path.exists(model_path):
    model_path = os.path.join("backend", "app", "ml", "footprint_model.pkl")

if not os.path.exists(model_path):
    try:
        print("Model file not found. Auto-training carbon footprint predictor model...")
        train_footprint_model()
    except Exception as e:
        print(f"Warning: Auto-training failed: {e}. Falling back to analytical calculator.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="EcoTwin AI Carbon Footprint awareness, prediction, and simulator APIs",
    version="1.0.0"
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(footprint.router, prefix=f"{settings.API_V1_STR}/footprint", tags=["Footprint"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to EcoTwin AI API", "docs_url": "/docs"}
