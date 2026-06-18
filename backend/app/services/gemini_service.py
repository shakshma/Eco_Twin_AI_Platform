"""
Gemini AI Service — generates personalized carbon reduction roadmap insights.
Uses the Gemini REST API directly for maximum compatibility (Python 3.8+).
Falls back to rule-based generation if the API is unavailable.
"""

import json
import traceback
import requests
from typing import Dict, List, Any, Optional
from app.core.config import settings


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def generate_roadmap_insights(
    user_profile: Dict[str, Any],
    current_footprint_kg: float,
    monthly_targets: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Calls Gemini REST API to generate personalized roadmap insights.
    
    Args:
        user_profile: Dict with keys like transport_mode, food_type, electricity_kwh, etc.
        current_footprint_kg: The user's current daily carbon footprint in kg.
        monthly_targets: List of dicts with {month, target_footprint_kg, focus_area}.
    
    Returns:
        Dict with 'narrative', 'monthly_insights' (list of {month, ai_insight, actions}) or None on failure.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("No Gemini API key configured.")
        return None

    prompt = _build_roadmap_prompt(user_profile, current_footprint_kg, monthly_targets)

    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            }
        }

        response = requests.post(
            f"{GEMINI_API_URL}?key={api_key}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )

        if response.status_code != 200:
            print(f"Gemini API returned status {response.status_code}: {response.text[:500]}")
            return None

        data = response.json()

        # Extract the text from the response
        candidates = data.get("candidates", [])
        if not candidates:
            print("Gemini API returned no candidates.")
            return None

        response_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        response_text = response_text.strip()

        # Handle markdown code block wrapping
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)
        print("Successfully generated Gemini AI roadmap insights.")
        return result

    except json.JSONDecodeError as e:
        print(f"Gemini response JSON parse error: {e}")
        return None
    except requests.exceptions.Timeout:
        print("Gemini API request timed out.")
        return None
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        traceback.print_exc()
        return None


def _build_roadmap_prompt(
    user_profile: Dict[str, Any],
    current_footprint_kg: float,
    monthly_targets: List[Dict[str, Any]],
) -> str:
    """Builds a detailed prompt for Gemini to generate roadmap insights."""

    targets_str = "\n".join([
        f"  - Month {t['month']}: Target {t['target_footprint_kg']:.1f} kg/day, Focus: {t['focus_area']}"
        for t in monthly_targets
    ])

    prompt = f"""You are an expert sustainability advisor and environmental scientist for the EcoTwin AI carbon footprint platform.

A user wants a personalized 6-month carbon reduction roadmap. Analyze their current lifestyle and generate specific, actionable, encouraging insights.

## User's Current Daily Lifestyle Profile:
- Transport mode: {user_profile.get('transport_mode', 'Car')}
- Daily commute distance: {user_profile.get('distance_km', 15)} km
- Daily electricity consumption: {user_profile.get('electricity_kwh', 6)} kWh
- Renewable energy usage: {user_profile.get('renewable_usage_pct', 20)}%
- Diet type: {user_profile.get('food_type', 'Non-Veg')}
- Daily waste generated: {user_profile.get('waste_generated_kg', 0.8)} kg
- Screen time: {user_profile.get('screen_time_hours', 5)} hours/day
- Eco-friendly actions performed: {user_profile.get('eco_actions', 2)} / 5 daily
- Current daily carbon footprint: {current_footprint_kg:.2f} kg CO₂e

## Monthly Reduction Targets:
{targets_str}

## Your Task:
Generate a JSON response with this EXACT structure (no markdown, just raw JSON):
{{
  "narrative": "A 2-3 sentence personalized overview paragraph explaining the user's carbon situation, what their biggest emission sources are, and an encouraging message about their reduction potential. Make it warm, specific to their data, and motivating.",
  "monthly_insights": [
    {{
      "month": 1,
      "ai_insight": "A 1-2 sentence specific insight about why this month's focus area matters for THIS user based on their data.",
      "actions": [
        "Specific actionable step 1 tailored to their lifestyle",
        "Specific actionable step 2 tailored to their lifestyle",
        "Specific actionable step 3 tailored to their lifestyle"
      ]
    }},
    {{
      "month": 2,
      "ai_insight": "...",
      "actions": ["...", "...", "..."]
    }},
    {{
      "month": 3,
      "ai_insight": "...",
      "actions": ["...", "...", "..."]
    }},
    {{
      "month": 4,
      "ai_insight": "...",
      "actions": ["...", "...", "..."]
    }},
    {{
      "month": 5,
      "ai_insight": "...",
      "actions": ["...", "...", "..."]
    }},
    {{
      "month": 6,
      "ai_insight": "...",
      "actions": ["...", "...", "..."]
    }}
  ]
}}

IMPORTANT RULES:
- Make every action SPECIFIC to the user's data (reference their transport mode, distance, diet, energy use etc.)
- Don't use generic advice. Tailor everything to their numbers.
- Keep tone encouraging but realistic.
- Each month should have exactly 3 actions.
- Return ONLY valid JSON, no markdown formatting.
"""
    return prompt


def generate_fallback_insights(
    user_profile: Dict[str, Any],
    current_footprint_kg: float,
    monthly_targets: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Rule-based fallback when Gemini API is unavailable.
    Generates structured but static insights based on user data.
    """
    transport = user_profile.get("transport_mode", "Car")
    food = user_profile.get("food_type", "Non-Veg")
    renewable = user_profile.get("renewable_usage_pct", 0)
    distance = user_profile.get("distance_km", 15)
    electricity = user_profile.get("electricity_kwh", 6)
    waste = user_profile.get("waste_generated_kg", 0.8)

    narrative = (
        f"Your current daily footprint of {current_footprint_kg:.1f} kg CO\u2082e is primarily driven by "
        f"{'high-emission vehicle commuting' if transport == 'Car' else 'your energy and diet choices'}. "
        f"With targeted changes across transport, diet, and energy over 6 months, "
        f"you have the potential to reduce your footprint by up to 40-60%. "
        f"Let's build your path to a greener lifestyle together!"
    )

    focus_actions = {
        "Transport": [
            f"Carpool or use public transit for at least 2 of your {distance:.0f} km commute days per week" if transport == "Car" else f"Continue your {transport.lower()} commute and optimize route efficiency",
            "Plan and batch errands to reduce total weekly vehicle trips by 30%",
            "Explore e-bike or scooter options for short trips under 5 km",
        ],
        "Energy": [
            f"{'Switch to a 100% renewable energy tariff' if renewable < 50 else 'Maintain your renewable energy commitment'} \u2014 your current grid mix is {renewable}% clean",
            f"Reduce daily electricity usage from {electricity:.1f} kWh by switching to LED bulbs and smart power strips",
            "Set a daily energy budget and use a smart meter to track real-time consumption",
        ],
        "Food & Diet": [
            f"{'Replace 3 meat meals per week with plant-based alternatives' if food == 'Non-Veg' else 'Explore more local and seasonal produce options'}",
            "Start a meal prep routine to reduce food waste by 40%",
            "Source groceries from local farms to cut food transport emissions",
        ],
        "Waste": [
            f"Set up home composting to divert 50% of your {waste:.1f} kg daily waste from landfill",
            "Adopt a zero-waste shopping kit (reusable bags, containers, water bottle)",
            "Start a recycling tracking habit \u2014 aim for 80% waste diversion rate",
        ],
        "Community & Lifestyle": [
            "Join a local environmental group or carbon reduction challenge",
            "Offset remaining emissions through verified carbon credit programs",
            "Share your progress on social media to inspire others and stay accountable",
        ],
        "Tech & Optimization": [
            "Use EcoTwin AI daily logging to track real progress against monthly targets",
            "Set up automated reminders for eco-actions (composting, transit days, meatless meals)",
            "Review and optimize home insulation and appliance energy ratings",
        ],
    }

    focus_areas = ["Transport", "Energy", "Food & Diet", "Waste", "Community & Lifestyle", "Tech & Optimization"]
    
    insights_map = {
        "Transport": f"Transportation accounts for a significant portion of your emissions. With a {distance:.0f} km daily commute by {transport.lower()}, optimizing this area yields the fastest initial gains.",
        "Energy": f"Your {electricity:.1f} kWh daily electricity usage at {renewable}% renewable mix has room for improvement. Switching to cleaner energy is one of the highest-impact long-term changes.",
        "Food & Diet": f"Your {'meat-based' if food == 'Non-Veg' else 'vegetarian' if food == 'Veg' else 'plant-based'} diet significantly impacts your footprint. Small dietary shifts can save 2-4 kg CO\u2082 daily.",
        "Waste": f"At {waste:.1f} kg waste per day, composting and recycling can cut waste-related emissions by up to 60%.",
        "Community & Lifestyle": "Building sustainable habits is easier with community support. This month focuses on embedding green practices into your social life.",
        "Tech & Optimization": "The final month focuses on using technology and data to maintain your gains and continuously optimize your carbon footprint.",
    }

    monthly_insights = []
    for i, target in enumerate(monthly_targets):
        focus = focus_areas[i] if i < len(focus_areas) else focus_areas[-1]
        monthly_insights.append({
            "month": target["month"],
            "ai_insight": insights_map.get(focus, "Focus on maintaining your progress and building lasting habits."),
            "actions": focus_actions.get(focus, ["Continue your current eco-friendly practices", "Track your daily carbon footprint", "Share your progress"]),
        })

    return {
        "narrative": narrative,
        "monthly_insights": monthly_insights,
    }
