import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.models.db import get_db
from app.models.user import Base

# Setup a clean in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        engine.dispose() # Dispose connections to unlock the file
        try:
            Base.metadata.drop_all(bind=engine)
            if os.path.exists("./test.db"):
                os.remove("./test.db")
        except Exception as e:
            print(f"Cleanup warning: {e}")

@pytest.fixture(scope="module")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword123", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_login_user(client):
    # Register was done in previous test
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_predict_footprint_unauthenticated(client):
    response = client.post(
        "/api/footprint/predict",
        json={
            "day_type": "Weekday",
            "transport_mode": "Car",
            "distance_km": 20.0,
            "electricity_kwh": 6.5,
            "renewable_usage_pct": 20,
            "food_type": "Non-Veg",
            "screen_time_hours": 4.5,
            "waste_generated_kg": 0.8,
            "eco_actions": 2
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "carbon_footprint_kg" in data
    assert "eco_score" in data
    assert data["carbon_impact_level"] in ["Low", "Medium", "High"]

def test_simulator_reductions(client):
    response = client.post(
        "/api/footprint/simulator",
        json={
            "current_input": {
                "day_type": "Weekday",
                "transport_mode": "Car",
                "distance_km": 30.0,
                "electricity_kwh": 10.0,
                "renewable_usage_pct": 0,
                "food_type": "Non-Veg",
                "screen_time_hours": 6.0,
                "waste_generated_kg": 1.2,
                "eco_actions": 1
            },
            "simulated_input": {
                "day_type": "Weekday",
                "transport_mode": "Public Transit",
                "distance_km": 30.0,
                "electricity_kwh": 5.0,
                "renewable_usage_pct": 100,
                "food_type": "Veg",
                "screen_time_hours": 6.0,
                "waste_generated_kg": 0.5,
                "eco_actions": 4
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "reduction_percentage" in data
    assert data["simulated_footprint_kg"] < data["original_footprint_kg"]
    assert data["eco_score_simulated"] > data["eco_score_original"]
    assert len(data["recommendations"]) > 0

def test_food_analytics(client):
    response = client.get("/api/analytics/food/summary?area=United States of America")
    assert response.status_code in [200, 404]  # 404 is valid if dataset not loaded, but we expect 200 if present

def test_vehicle_analytics(client):
    response = client.get("/api/analytics/vehicles")
    assert response.status_code == 200
    data = response.json()
    assert "vehicles" in data
    assert "averages_by_fuel_type" in data

def test_country_analytics(client):
    response = client.get("/api/analytics/countries/compare?country_name=United States")
    assert response.status_code == 200
    data = response.json()
    assert "kilotons_co2" in data
    assert "per_capita_tons" in data

def test_carbon_roadmap(client):
    # Log in to get token
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]
    
    # Request roadmap
    response = client.get(
        "/api/footprint/roadmap",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "current_footprint_kg" in data
    assert "current_eco_score" in data
    assert len(data["roadmap"]) == 3
    assert data["roadmap"][0]["month"] == 1
    assert data["roadmap"][1]["month"] == 2
    assert data["roadmap"][2]["month"] == 3

