from app.schemas.footprint import FootprintInput, Recommendation, SimulatorResponse, FootprintPredictionResponse
from typing import List

def calculate_footprint_details(inputs: FootprintInput) -> float:
    # 1. Transport Emissions
    transport_multipliers = {
        "Car": 0.18,
        "Public Transit": 0.05,
        "Electric Vehicle": 0.03,
        "Bike": 0.0,
        "Walk": 0.0
    }
    transport_mult = transport_multipliers.get(inputs.transport_mode, 0.1)
    transport_emissions = inputs.distance_km * transport_mult

    # 2. Electricity Emissions (Grid factor: ~0.45 kg CO2 / kWh)
    renewable_factor = 1.0 - (inputs.renewable_usage_pct / 100.0)
    electricity_emissions = inputs.electricity_kwh * 0.45 * renewable_factor

    # 3. Food Emissions (Veg/Vegan/Non-veg daily baselines)
    food_baselines = {
        "Vegan": 1.5,
        "Veg": 2.5,
        "Non-Veg": 6.0
    }
    food_emissions = food_baselines.get(inputs.food_type, 3.5)

    # 4. Waste Emissions (~1.2 kg CO2 / kg waste)
    waste_emissions = inputs.waste_generated_kg * 1.2

    # Total Footprint
    return transport_emissions + electricity_emissions + food_emissions + waste_emissions

def generate_eco_score(footprint_kg: float, eco_actions: int) -> int:
    # Baseline footprint target is 5.0 kg or lower. Deduct score based on excess footprint.
    # 10 kg footprint = 80, 20 kg footprint = 60, etc.
    footprint_penalty = footprint_kg * 3.5
    score = 100 - footprint_penalty
    
    # Reward eco-actions (+5 per action, up to +25)
    action_reward = eco_actions * 5
    score += action_reward
    
    # Cap score
    return max(0, min(100, int(score)))

def determine_impact_level(footprint_kg: float) -> str:
    if footprint_kg < 8.0:
        return "Low"
    elif footprint_kg < 18.0:
        return "Medium"
    else:
        return "High"

def get_personalized_recommendations(inputs: FootprintInput) -> List[Recommendation]:
    recommendations = []

    # 1. Transport recommendation
    if inputs.transport_mode == "Car" and inputs.distance_km > 5.0:
        recommendations.append(Recommendation(
            action="Switch to Public Transit or Bike for commutes under 10 km",
            category="Transport",
            co2_savings_kg=inputs.distance_km * (0.18 - 0.05),
            difficulty="Medium"
        ))
    if inputs.transport_mode == "Car":
        recommendations.append(Recommendation(
            action="Consider upgrading to an Electric Vehicle (EV) for driving commutes",
            category="Transport",
            co2_savings_kg=inputs.distance_km * (0.18 - 0.03),
            difficulty="Hard"
        ))

    # 2. Electricity recommendation
    if inputs.renewable_usage_pct < 100:
        savings = inputs.electricity_kwh * 0.45 * (1.0 - inputs.renewable_usage_pct / 100.0)
        recommendations.append(Recommendation(
            action=f"Increase your renewable energy usage to 100% (e.g. solar or green tariff)",
            category="Energy",
            co2_savings_kg=savings,
            difficulty="Medium"
        ))
    if inputs.electricity_kwh > 5.0:
        recommendations.append(Recommendation(
            action="Turn off idle appliances and switch to LED lighting",
            category="Energy",
            co2_savings_kg=inputs.electricity_kwh * 0.15 * 0.45,
            difficulty="Easy"
        ))

    # 3. Food recommendation
    if inputs.food_type == "Non-Veg":
        recommendations.append(Recommendation(
            action="Swap two beef/pork meals per week for plant-based alternatives",
            category="Food",
            co2_savings_kg=3.5, # 6.0 - 2.5
            difficulty="Easy"
        ))
        recommendations.append(Recommendation(
            action="Adopt a fully Vegetarian or Vegan diet",
            category="Food",
            co2_savings_kg=4.5, # 6.0 - 1.5
            difficulty="Hard"
        ))
    elif inputs.food_type == "Veg":
        recommendations.append(Recommendation(
            action="Switch from Vegetarian to Vegan to eliminate dairy/egg emission footprints",
            category="Food",
            co2_savings_kg=1.0, # 2.5 - 1.5
            difficulty="Medium"
        ))

    # 4. Waste recommendation
    if inputs.waste_generated_kg > 0.5:
        recommendations.append(Recommendation(
            action="Implement organic composting and intensive recycling at home",
            category="Waste",
            co2_savings_kg=inputs.waste_generated_kg * 0.4 * 1.2,
            difficulty="Easy"
        ))

    # 5. Eco Actions recommendation
    if inputs.eco_actions < 5:
        recommendations.append(Recommendation(
            action="Perform at least 3 eco-friendly actions daily (e.g., composting, reusing water bottles, local goods shopping)",
            category="Lifestyle",
            co2_savings_kg=1.5,
            difficulty="Easy"
        ))

    # Sort recommendations by savings descending
    recommendations.sort(key=lambda r: r.co2_savings_kg, reverse=True)
    return recommendations
