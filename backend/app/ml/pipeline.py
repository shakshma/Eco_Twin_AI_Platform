import os
import pickle
import numpy as np
import pandas as pd
import shap
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Paths config
MODEL_PATH = os.path.join(os.path.dirname(__file__), "footprint_model.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "personal_carbon_footprint_behavior.csv")

def preprocess_and_engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Performs data preprocessing and feature engineering.
    """
    # Create copy to avoid SettingWithCopy warning
    processed = df.copy()
    
    # 1. Feature Engineering
    # Calculate non-renewable electricity consumption
    processed["non_renewable_kwh"] = processed["electricity_kwh"] * (1.0 - (processed["renewable_usage_pct"] / 100.0))
    
    # Estimate travel emissions (based on distance and vehicle/transit averages)
    transport_multipliers = {
        "Car": 0.18,
        "Public Transit": 0.05,
        "Electric Vehicle": 0.03,
        "Bike": 0.0,
        "Walk": 0.0
    }
    processed["estimated_travel_emissions"] = processed.apply(
        lambda row: row["distance_km"] * transport_multipliers.get(row["transport_mode"], 0.1), axis=1
    )
    
    # Eco-efficiency metric
    processed["eco_efficiency"] = processed["eco_actions"] / (processed["carbon_footprint_kg"] + 1.0)
    
    return processed

def build_model_pipeline(categorical_features, numeric_features):
    """
    Builds the Scikit-learn Pipeline with preprocessing (OHE + scaling) and model.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numeric_features)
        ],
        remainder="passthrough"
    )
    
    # Random Forest Regressor fits tabular data and supports SHAP TreeExplainer
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    return pipeline

def calculate_eco_score(footprint_kg: float, eco_actions: int) -> int:
    """
    Eco Score Model: Estimates score out of 100 based on footprint penalty and actions reward.
    """
    footprint_penalty = footprint_kg * 3.5
    score = 100 - footprint_penalty + (eco_actions * 5)
    return max(0, min(100, int(score)))

def generate_shap_explainability(pipeline, X_train, X_test):
    """
    Generates SHAP explainability values and prints feature importance.
    """
    try:
        # Get the trained regressor and preprocessor
        preprocessor = pipeline.named_steps["preprocessor"]
        regressor = pipeline.named_steps["regressor"]
        
        # Transform training data to extract features names
        X_train_trans = preprocessor.transform(X_train)
        
        # Get feature names after One-Hot Encoding
        ohe = preprocessor.named_transformers_["cat"]
        cat_features = list(ohe.get_feature_names_out())
        num_features = list(preprocessor.named_transformers_["num"].get_feature_names_out())
        
        feature_names = cat_features + num_features
        
        # Run SHAP TreeExplainer
        explainer = shap.TreeExplainer(regressor)
        shap_values = explainer.shap_values(X_train_trans)
        
        # Calculate mean absolute SHAP values for feature importance
        mean_shap = np.abs(shap_values).mean(axis=0)
        shap_df = pd.DataFrame({
            "feature": feature_names,
            "mean_shap_value": mean_shap
        }).sort_values(by="mean_shap_value", ascending=False)
        
        print("\n--- SHAP Feature Importances ---")
        for idx, row in shap_df.iterrows():
            print(f"{row['feature']}: {row['mean_shap_value']:.4f}")
        print("--------------------------------\n")
        
        return shap_df.to_dict(orient="records")
    except Exception as e:
        print(f"SHAP explanation failed: {e}")
        return []

def train_and_serialize(data_path: str = DATA_PATH, model_save_path: str = MODEL_PATH):
    """
    Runs full pipeline: Preprocessing, Feature Engineering, Training, Evaluation, SHAP, and Serialization.
    """
    if not os.path.exists(data_path):
        # Fallback to local execution paths
        data_path = "data/personal_carbon_footprint_behavior.csv"
        
    print(f"Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    
    # 1. Feature Engineering
    df_engineered = preprocess_and_engineer_features(df)
    
    # Define features and target
    X = df_engineered[[
        "day_type", "transport_mode", "distance_km", "electricity_kwh", 
        "renewable_usage_pct", "food_type", "screen_time_hours", "waste_generated_kg", 
        "eco_actions", "non_renewable_kwh", "estimated_travel_emissions", "eco_efficiency"
    ]]
    y = df_engineered["carbon_footprint_kg"]
    
    # Split datasets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Features definitions
    categorical_cols = ["day_type", "transport_mode", "food_type"]
    numeric_cols = [
        "distance_km", "electricity_kwh", "renewable_usage_pct", 
        "screen_time_hours", "waste_generated_kg", "eco_actions",
        "non_renewable_kwh", "estimated_travel_emissions", "eco_efficiency"
    ]
    
    # 2. Build and train model pipeline
    pipeline = build_model_pipeline(categorical_cols, numeric_cols)
    pipeline.fit(X_train, y_train)
    
    # 3. Model Evaluation Metrics
    y_pred = pipeline.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Model Evaluation ---")
    print(f"RMSE: {rmse:.4f} kg CO2")
    print(f"MAE:  {mae:.4f} kg CO2")
    print(f"R²:   {r2:.4f}")
    print("------------------------\n")
    
    # 4. SHAP Explainability
    shap_importances = generate_shap_explainability(pipeline, X_train, X_test)
    
    # 5. Serialization
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    with open(model_save_path, "wb") as f:
        pickle.dump({
            "model_pipeline": pipeline,
            "metrics": {"rmse": rmse, "mae": mae, "r2": r2},
            "shap_importances": shap_importances
        }, f)
    print(f"Trained pipeline serialized successfully to {model_save_path}")
    
    return {
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
        "shap": shap_importances
    }

def run_retraining_pipeline():
    """
    Automated retraining pipeline entry point.
    """
    print("Starting automated model retraining sequence...")
    results = train_and_serialize()
    print("Automated retraining sequence completed.")
    return results

if __name__ == "__main__":
    train_and_serialize()
