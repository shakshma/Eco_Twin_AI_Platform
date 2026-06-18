from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FootprintInput(BaseModel):
    day_type: str  # Weekday / Weekend
    transport_mode: str  # Bike, Public Transit, Car, Walk, Electric Vehicle
    distance_km: float
    electricity_kwh: float
    renewable_usage_pct: int
    food_type: str  # Non-Veg, Veg, Vegan
    screen_time_hours: float
    waste_generated_kg: float
    eco_actions: int  # 0 to 5

class FootprintLogResponse(FootprintInput):
    id: int
    date: datetime
    carbon_footprint_kg: float
    carbon_impact_level: str

    class Config:
        from_attributes = True

class FootprintPredictionResponse(BaseModel):
    carbon_footprint_kg: float
    carbon_impact_level: str
    eco_score: int

class Recommendation(BaseModel):
    action: str
    category: str
    co2_savings_kg: float
    difficulty: str  # Easy, Medium, Hard

class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]

class SimulatorInput(BaseModel):
    current_input: FootprintInput
    simulated_input: FootprintInput

class SimulatorResponse(BaseModel):
    original_footprint_kg: float
    simulated_footprint_kg: float
    reduction_percentage: float
    eco_score_original: int
    eco_score_simulated: int
    recommendations: List[Recommendation]

class RoadmapMonth(BaseModel):
    month: int
    target_footprint_kg: float
    projected_eco_score: int
    focus_area: str
    ai_insight: str
    actions: List[str]
    category_breakdown: List[dict]  # [{category, current_kg, target_kg, saving_kg}]

class RoadmapResponse(BaseModel):
    current_footprint_kg: float
    current_eco_score: int
    target_annual_tons: float
    total_potential_savings_kg: float
    gemini_narrative: str
    roadmap: List[RoadmapMonth]

