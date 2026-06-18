import os
import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score

def train_footprint_model():
    # Load dataset
    data_path = os.path.join("..", "..", "data", "personal_carbon_footprint_behavior.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join("data", "personal_carbon_footprint_behavior.csv")
        
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Define features and target
    X = df[[
        "day_type", "transport_mode", "distance_km", "electricity_kwh", 
        "renewable_usage_pct", "food_type", "screen_time_hours", "waste_generated_kg", "eco_actions"
    ]]
    y = df["carbon_footprint_kg"]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Categorical columns to encode
    categorical_features = ["day_type", "transport_mode", "food_type"]
    
    # Setup preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ],
        remainder="passthrough"
    )
    
    # Combine preprocessing and model in pipeline
    model_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    # Train
    print("Training Random Forest Regressor model...")
    model_pipeline.fit(X_train, y_train)
    
    # Predict & Evaluate
    y_pred = model_pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Training completed.")
    print(f"Mean Absolute Error: {mae:.4f} kg CO2")
    print(f"R2 Score: {r2:.4f}")
    
    # Save the pipeline
    os.makedirs(os.path.join("backend", "app", "ml"), exist_ok=True)
    os.makedirs("app/ml", exist_ok=True)
    
    model_dir = "app/ml" if os.path.exists("app") else os.path.join("backend", "app", "ml")
    model_path = os.path.join(model_dir, "footprint_model.pkl")
    
    with open(model_path, "wb") as f:
        pickle.dump(model_pipeline, f)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_footprint_model()
