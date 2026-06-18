import os
import pickle
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.db import get_db
from app.models.user import User, CarbonFootprintLog
from app.schemas.footprint import (
    FootprintInput, FootprintPredictionResponse, FootprintLogResponse,
    SimulatorInput, SimulatorResponse, Recommendation, RoadmapResponse, RoadmapMonth
)
from app.api.deps import get_current_user, get_required_current_user
from app.services.calculator import (
    calculate_footprint_details, generate_eco_score,
    determine_impact_level, get_personalized_recommendations
)

from app.ml.pipeline import preprocess_and_engineer_features

router = APIRouter()

# Global variable for the ML model
_model = None

def load_ml_model():
    """Lazy loads the trained Random Forest model."""
    global _model
    if _model is not None:
        return _model
    
    model_path = os.path.join("app", "ml", "footprint_model.pkl")
    if not os.path.exists(model_path):
        model_path = os.path.join("backend", "app", "ml", "footprint_model.pkl")
        
    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                loaded = pickle.load(f)
                if isinstance(loaded, dict) and "model_pipeline" in loaded:
                    _model = loaded["model_pipeline"]
                else:
                    _model = loaded
            print("Successfully loaded ML prediction model.")
        except Exception as e:
            print(f"Error loading ML prediction model: {e}")
    return _model

@router.post("/predict", response_model=FootprintPredictionResponse)
def predict_footprint(
    inputs: FootprintInput, 
    db: Session = Depends(get_db), 
    current_user: Optional[User] = Depends(get_current_user)
):
    """Predicts carbon footprint using trained ML model, falling back to rule-based logic."""
    model = load_ml_model()
    
    if model is not None:
        try:
            # Prepare data for prediction
            input_df = pd.DataFrame([{
                "day_type": inputs.day_type,
                "transport_mode": inputs.transport_mode,
                "distance_km": inputs.distance_km,
                "electricity_kwh": inputs.electricity_kwh,
                "renewable_usage_pct": inputs.renewable_usage_pct,
                "food_type": inputs.food_type,
                "screen_time_hours": inputs.screen_time_hours,
                "waste_generated_kg": inputs.waste_generated_kg,
                "eco_actions": inputs.eco_actions,
                # Placeholders for engineered features so they get engineered properly
                "carbon_footprint_kg": 0.0 
            }])
            
            # Apply feature engineering pipeline
            engineered_df = preprocess_and_engineer_features(input_df)
            # Drop the carbon_footprint_kg column used for eco_efficiency calculation placeholder
            X_infer = engineered_df[[
                "day_type", "transport_mode", "distance_km", "electricity_kwh", 
                "renewable_usage_pct", "food_type", "screen_time_hours", "waste_generated_kg", 
                "eco_actions", "non_renewable_kwh", "estimated_travel_emissions", "eco_efficiency"
            ]]
            
            footprint_kg = float(model.predict(X_infer)[0])
        except Exception as e:
            print(f"ML Prediction failed, using fallback: {e}")
            footprint_kg = calculate_footprint_details(inputs)
    else:
        # Fallback to analytical calculation
        footprint_kg = calculate_footprint_details(inputs)

    impact_level = determine_impact_level(footprint_kg)
    eco_score = generate_eco_score(footprint_kg, inputs.eco_actions)

    # Save log to DB if authenticated user is present
    if current_user:
        log_entry = CarbonFootprintLog(
            user_id=current_user.id,
            day_type=inputs.day_type,
            transport_mode=inputs.transport_mode,
            distance_km=inputs.distance_km,
            electricity_kwh=inputs.electricity_kwh,
            renewable_usage_pct=inputs.renewable_usage_pct,
            food_type=inputs.food_type,
            screen_time_hours=inputs.screen_time_hours,
            waste_generated_kg=inputs.waste_generated_kg,
            eco_actions=inputs.eco_actions,
            carbon_footprint_kg=footprint_kg,
            carbon_impact_level=impact_level
        )
        db.add(log_entry)
        db.commit()

    return FootprintPredictionResponse(
        carbon_footprint_kg=round(footprint_kg, 2),
        carbon_impact_level=impact_level,
        eco_score=eco_score
    )

@router.get("/history", response_model=List[FootprintLogResponse])
def get_history(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_required_current_user)
):
    """Retrieves all logged daily footprint entries for the user."""
    logs = db.query(CarbonFootprintLog).filter(CarbonFootprintLog.user_id == current_user.id).order_by(CarbonFootprintLog.date.desc()).all()
    return logs

@router.post("/simulator", response_model=SimulatorResponse)
def simulate_reductions(inputs: SimulatorInput):
    """Simulates carbon footprint differences and yields reduction insights."""
    # Process original input
    orig_footprint = calculate_footprint_details(inputs.current_input)
    orig_score = generate_eco_score(orig_footprint, inputs.current_input.eco_actions)

    # Process simulated input
    sim_footprint = calculate_footprint_details(inputs.simulated_input)
    sim_score = generate_eco_score(sim_footprint, inputs.simulated_input.eco_actions)

    # Calculate differences
    reduction_pct = 0.0
    if orig_footprint > 0:
        reduction_pct = max(0.0, ((orig_footprint - sim_footprint) / orig_footprint) * 100.0)

    # Generate recommendations for current behavior to improve
    recs = get_personalized_recommendations(inputs.current_input)

    return SimulatorResponse(
        original_footprint_kg=round(orig_footprint, 2),
        simulated_footprint_kg=round(sim_footprint, 2),
        reduction_percentage=round(reduction_pct, 1),
        eco_score_original=orig_score,
        eco_score_simulated=sim_score,
        recommendations=recs
    )

@router.get("/recommendations", response_model=List[Recommendation])
def get_latest_recommendations(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_required_current_user)
):
    """Fetches personalized tips based on user's latest logged footprint behavior."""
    latest_log = db.query(CarbonFootprintLog).filter(
        CarbonFootprintLog.user_id == current_user.id
    ).order_by(CarbonFootprintLog.date.desc()).first()

    if not latest_log:
        # Default mock footprint input to offer generic recommendations
        default_input = FootprintInput(
            day_type="Weekday",
            transport_mode="Car",
            distance_km=15.0,
            electricity_kwh=8.0,
            renewable_usage_pct=0,
            food_type="Non-Veg",
            screen_time_hours=5.0,
            waste_generated_kg=1.0,
            eco_actions=0
        )
        return get_personalized_recommendations(default_input)
    
    # Map model log to schema input
    user_inputs = FootprintInput(
        day_type=latest_log.day_type,
        transport_mode=latest_log.transport_mode,
        distance_km=latest_log.distance_km,
        electricity_kwh=latest_log.electricity_kwh,
        renewable_usage_pct=latest_log.renewable_usage_pct,
        food_type=latest_log.food_type,
        screen_time_hours=latest_log.screen_time_hours,
        waste_generated_kg=latest_log.waste_generated_kg,
        eco_actions=latest_log.eco_actions
    )
    
    return get_personalized_recommendations(user_inputs)

@router.get("/roadmap", response_model=RoadmapResponse)
def get_carbon_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_required_current_user)
):
    """
    Generates a 6-month AI-powered Carbon Reduction Roadmap.
    Uses ML predictions + Gemini AI for personalized insights and action items.
    """
    from app.services.gemini_service import generate_roadmap_insights, generate_fallback_insights

    latest_log = db.query(CarbonFootprintLog).filter(
        CarbonFootprintLog.user_id == current_user.id
    ).order_by(CarbonFootprintLog.date.desc()).first()

    if not latest_log:
        latest_log = CarbonFootprintLog(
            carbon_footprint_kg=15.0,
            day_type="Weekday",
            transport_mode="Car",
            distance_km=20.0,
            electricity_kwh=8.0,
            renewable_usage_pct=20,
            food_type="Non-Veg",
            screen_time_hours=5.0,
            waste_generated_kg=1.0,
            eco_actions=1
        )

    current_fp = latest_log.carbon_footprint_kg
    current_score = generate_eco_score(current_fp, latest_log.eco_actions)

    # ----- Compute category baselines -----
    transport_multipliers = {
        "Car": 0.18, "Public Transit": 0.05, "Electric Vehicle": 0.03,
        "Bike": 0.0, "Walk": 0.0
    }
    transport_em = latest_log.distance_km * transport_multipliers.get(latest_log.transport_mode, 0.1)
    renewable_factor = 1.0 - (latest_log.renewable_usage_pct / 100.0)
    energy_em = latest_log.electricity_kwh * 0.45 * renewable_factor
    food_baselines = {"Vegan": 1.5, "Veg": 2.5, "Non-Veg": 6.0}
    food_em = food_baselines.get(latest_log.food_type, 3.5)
    waste_em = latest_log.waste_generated_kg * 1.2

    # ----- 6-month progressive targets -----
    focus_areas = [
        "Transport",
        "Energy",
        "Food & Diet",
        "Waste",
        "Community & Lifestyle",
        "Tech & Optimization",
    ]

    # Reduction percentages per month (cumulative from current)
    reduction_schedule = [0.12, 0.22, 0.34, 0.44, 0.52, 0.58]

    # Category-specific reduction ratios per focus month
    category_reductions = [
        # M1: Transport focus
        {"transport": 0.40, "energy": 0.05, "food": 0.05, "waste": 0.05},
        # M2: Energy focus
        {"transport": 0.45, "energy": 0.35, "food": 0.08, "waste": 0.10},
        # M3: Food focus
        {"transport": 0.50, "energy": 0.40, "food": 0.35, "waste": 0.15},
        # M4: Waste focus
        {"transport": 0.55, "energy": 0.45, "food": 0.40, "waste": 0.50},
        # M5: Community
        {"transport": 0.58, "energy": 0.50, "food": 0.45, "waste": 0.55},
        # M6: Optimization
        {"transport": 0.60, "energy": 0.55, "food": 0.50, "waste": 0.60},
    ]

    monthly_targets = []
    roadmap_months = []

    for i in range(6):
        month_num = i + 1
        target_fp = max(1.0, current_fp * (1.0 - reduction_schedule[i]))
        eco_score = generate_eco_score(target_fp, min(5, latest_log.eco_actions + month_num))

        cr = category_reductions[i]
        t_target = max(0.0, transport_em * (1.0 - cr["transport"]))
        e_target = max(0.0, energy_em * (1.0 - cr["energy"]))
        f_target = max(0.0, food_em * (1.0 - cr["food"]))
        w_target = max(0.0, waste_em * (1.0 - cr["waste"]))

        category_breakdown = [
            {
                "category": "Transport",
                "current_kg": round(transport_em, 2),
                "target_kg": round(t_target, 2),
                "saving_kg": round(transport_em - t_target, 2),
            },
            {
                "category": "Energy",
                "current_kg": round(energy_em, 2),
                "target_kg": round(e_target, 2),
                "saving_kg": round(energy_em - e_target, 2),
            },
            {
                "category": "Food",
                "current_kg": round(food_em, 2),
                "target_kg": round(f_target, 2),
                "saving_kg": round(food_em - f_target, 2),
            },
            {
                "category": "Waste",
                "current_kg": round(waste_em, 2),
                "target_kg": round(w_target, 2),
                "saving_kg": round(waste_em - w_target, 2),
            },
        ]

        monthly_targets.append({
            "month": month_num,
            "target_footprint_kg": round(target_fp, 2),
            "focus_area": focus_areas[i],
        })

        roadmap_months.append({
            "month": month_num,
            "target_footprint_kg": round(target_fp, 2),
            "projected_eco_score": eco_score,
            "focus_area": focus_areas[i],
            "category_breakdown": category_breakdown,
        })

    # ----- Gemini AI integration -----
    user_profile = {
        "transport_mode": latest_log.transport_mode,
        "distance_km": latest_log.distance_km,
        "electricity_kwh": latest_log.electricity_kwh,
        "renewable_usage_pct": latest_log.renewable_usage_pct,
        "food_type": latest_log.food_type,
        "screen_time_hours": latest_log.screen_time_hours,
        "waste_generated_kg": latest_log.waste_generated_kg,
        "eco_actions": latest_log.eco_actions,
    }

    ai_result = generate_roadmap_insights(user_profile, current_fp, monthly_targets)

    if ai_result is None:
        print("Gemini API unavailable — using rule-based fallback.")
        ai_result = generate_fallback_insights(user_profile, current_fp, monthly_targets)

    # Merge AI insights into roadmap months
    gemini_narrative = ai_result.get("narrative", "Your personalized carbon reduction roadmap is ready. Follow the monthly targets below to steadily reduce your environmental impact.")
    ai_monthly = {m["month"]: m for m in ai_result.get("monthly_insights", [])}

    final_roadmap = []
    for rm in roadmap_months:
        month_num = rm["month"]
        ai_month = ai_monthly.get(month_num, {})
        final_roadmap.append(RoadmapMonth(
            month=month_num,
            target_footprint_kg=rm["target_footprint_kg"],
            projected_eco_score=rm["projected_eco_score"],
            focus_area=rm["focus_area"],
            ai_insight=ai_month.get("ai_insight", f"Focus on {rm['focus_area'].lower()} changes to hit your Month {month_num} target."),
            actions=ai_month.get("actions", [f"Work on reducing {rm['focus_area'].lower()} emissions"]),
            category_breakdown=rm["category_breakdown"],
        ))

    # Compute totals
    final_target_fp = roadmap_months[-1]["target_footprint_kg"]
    total_savings = round(current_fp - final_target_fp, 2)
    target_annual_tons = round(final_target_fp * 365 / 1000, 2)

    return RoadmapResponse(
        current_footprint_kg=round(current_fp, 2),
        current_eco_score=current_score,
        target_annual_tons=target_annual_tons,
        total_potential_savings_kg=total_savings,
        gemini_narrative=gemini_narrative,
        roadmap=final_roadmap,
    )

