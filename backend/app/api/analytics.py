import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any

router = APIRouter()

# Global variables for caching datasets in memory
_agro_df = None
_country_df = None
_vehicle_df = None

def get_data_dir():
    """Locates the data directory."""
    path = "data"
    if not os.path.exists(path):
        path = os.path.join("..", "data")
    if not os.path.exists(path):
        path = os.path.join("backend", "data")
    return path

def load_datasets():
    global _agro_df, _country_df, _vehicle_df
    data_dir = get_data_dir()
    
    if _agro_df is None:
        path = os.path.join(data_dir, "Agrofood_co2_emission.csv")
        if os.path.exists(path):
            try:
                _agro_df = pd.read_csv(path, encoding='utf-8')
            except Exception:
                _agro_df = pd.read_csv(path, encoding='latin-1')
            # Rename temperature column to clean up special character 
            temp_cols = [c for c in _agro_df.columns if 'temperature' in c.lower()]
            if temp_cols:
                _agro_df.rename(columns={temp_cols[0]: 'Average Temperature C'}, inplace=True)
            else:
                _agro_df['Average Temperature C'] = 0.0
            
    if _country_df is None:
        path = os.path.join(data_dir, "Carbon_(CO2)_Emissions_by_Country.csv")
        if os.path.exists(path):
            _country_df = pd.read_csv(path)
            
    if _vehicle_df is None:
        path = os.path.join(data_dir, "vehicle_data_sample.csv")
        if os.path.exists(path):
            _vehicle_df = pd.read_csv(path)

# Initialize on module load
try:
    load_datasets()
except Exception as e:
    print(f"Initial dataset loading warning: {e}")

@router.get("/food/summary")
def get_food_emissions_summary(area: str = "United States of America"):
    """Gets food systems emissions breakdown for a selected country."""
    load_datasets()
    if _agro_df is None:
        raise HTTPException(status_code=500, detail="Agrofood dataset not loaded.")
    
    # Filter by country
    df_filtered = _agro_df[_agro_df['Area'].str.lower() == area.lower()]
    if df_filtered.empty:
        # Fallback to the first country available
        df_filtered = _agro_df[_agro_df['Area'] == 'Afghanistan']
        if df_filtered.empty:
            raise HTTPException(status_code=404, detail="Area data not found.")

    # Sort by Year
    df_sorted = df_filtered.sort_values(by='Year')
    
    # Get recent year (e.g. 2020 or maximum year available)
    latest_row = df_sorted.iloc[-1]
    
    # Breakdown of emissions in latest year
    breakdown = {
        "Savanna fires": float(latest_row.get("Savanna fires", 0)),
        "Forest fires": float(latest_row.get("Forest fires", 0)),
        "Crop Residues": float(latest_row.get("Crop Residues", 0)),
        "Rice Cultivation": float(latest_row.get("Rice Cultivation", 0)),
        "Food Transport": float(latest_row.get("Food Transport", 0)),
        "Food Household Consumption": float(latest_row.get("Food Household Consumption", 0)),
        "Food Retail": float(latest_row.get("Food Retail", 0)),
        "Food Packaging": float(latest_row.get("Food Packaging", 0)),
        "Food Processing": float(latest_row.get("Food Processing", 0)),
        "Agrifood Systems Waste Disposal": float(latest_row.get("Agrifood Systems Waste Disposal", 0))
    }
    
    # Historical trend
    history = df_sorted[['Year', 'total_emission', 'Average Temperature C']].rename(
        columns={'Average Temperature C': 'temperature_change'}
    ).to_dict(orient='records')
    
    return {
        "country": latest_row['Area'],
        "latest_year": int(latest_row['Year']),
        "total_emission_kt": float(latest_row['total_emission']),
        "breakdown": breakdown,
        "history": history
    }

@router.get("/food/countries")
def get_food_countries():
    """Returns a list of unique countries available in the Agrofood dataset."""
    load_datasets()
    if _agro_df is None:
        return []
    return sorted(_agro_df['Area'].unique().tolist())

@router.get("/vehicles")
def get_vehicles_list():
    """Returns the sample vehicle models with their specifications."""
    load_datasets()
    if _vehicle_df is None:
        raise HTTPException(status_code=500, detail="Vehicle dataset not loaded.")
    
    # Clean up dataset columns for output
    cols = ["brand", "model", "year", "fuel_type", "co2_emissions_gkm", "is_ev", "is_hybrid", "is_phev", "curb_weight_kg"]
    existing_cols = [c for c in cols if c in _vehicle_df.columns]
    
    vehicles = _vehicle_df[existing_cols].to_dict(orient='records')
    
    # Compute averages by fuel type
    averages = _vehicle_df.groupby('fuel_type')['co2_emissions_gkm'].mean().round(1).to_dict()
    
    return {
        "vehicles": vehicles,
        "averages_by_fuel_type": averages
    }

@router.get("/countries/compare")
def compare_countries(country_name: str = "United States"):
    """Compares user's selected country with global standards."""
    load_datasets()
    if _country_df is None:
        raise HTTPException(status_code=500, detail="Country emissions dataset not loaded.")
    
    # Search for the selected country (handle casing and partial matches)
    c_df = _country_df[_country_df['Country'].str.lower() == country_name.lower()]
    if c_df.empty:
        c_df = _country_df[_country_df['Country'].str.lower().str.contains(country_name.lower())]
    
    if c_df.empty:
        # Fallback to US
        c_df = _country_df[_country_df['Country'] == 'United States']
        if c_df.empty:
            raise HTTPException(status_code=404, detail="Country emissions data not found.")

    # Get latest date records
    c_df['Year'] = c_df['Date'].apply(lambda x: int(x.split('-')[-1]) if '-' in str(x) else int(x))
    c_sorted = c_df.sort_values(by='Year')
    latest_record = c_sorted.iloc[-1]
    
    # Get top 10 emitting countries for comparison in same year
    target_year = latest_record['Year']
    
    # Helper to parse year from other rows
    _country_df['Year'] = _country_df['Date'].apply(lambda x: int(x.split('-')[-1]) if '-' in str(x) else int(x))
    year_df = _country_df[_country_df['Year'] == target_year]
    
    top_10 = year_df.sort_values(by='Kilotons of Co2', ascending=False).head(10)[['Country', 'Kilotons of Co2', 'Metric Tons Per Capita']].to_dict(orient='records')
    
    # Regional averages
    region_averages = year_df.groupby('Region')['Metric Tons Per Capita'].mean().round(2).to_dict()
    
    return {
        "country": latest_record['Country'],
        "region": latest_record['Region'],
        "year": int(target_year),
        "kilotons_co2": float(latest_record['Kilotons of Co2']),
        "per_capita_tons": float(latest_record['Metric Tons Per Capita']),
        "top_emitters": top_10,
        "region_averages": region_averages,
        "history": c_sorted[['Year', 'Kilotons of Co2', 'Metric Tons Per Capita']].to_dict(orient='records')
    }

@router.get("/countries/list")
def get_countries_list():
    """Returns a list of unique countries available in the general CO2 dataset."""
    load_datasets()
    if _country_df is None:
        return []
    return sorted(_country_df['Country'].unique().tolist())
