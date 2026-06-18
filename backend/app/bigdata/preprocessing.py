import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, mean, lit, to_date, year
from pyspark.ml.feature import Imputer

def get_spark_session():
    """Initializes and returns a Spark Session."""
    return (SparkSession.builder
            .appName("EcoTwinAI-DatasetPreprocessing")
            .master("local[*]")
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "4")
            .getOrCreate())

def preprocess_agrofood(spark, file_path):
    """Processes Agrofood CO2 Emission Dataset."""
    df = spark.read.csv(file_path, header=True, inferSchema=True)
    
    # 1. Handle missing values for emissions columns with column average
    impute_cols = [
        "Crop Residues", "Manure applied to Soils", "Manure Management", 
        "On-farm energy use", "IPPU", "Forestland", "Net Forest conversion",
        "Savanna fires", "Forest fires", "Food Household Consumption", "Fires in humid tropical forests"
    ]
    
    imputer = Imputer(inputCols=impute_cols, outputCols=impute_cols).setStrategy("mean")
    df = imputer.fit(df).transform(df)
    
    # 2. Feature Engineering
    df = df.withColumn("total_population", col("Rural population") + col("Urban population"))
    df = df.withColumn("emission_per_capita", col("total_emission") / (col("total_population") + 1.0))
    df = df.withColumn("urbanization_ratio", col("Urban population") / (col("total_population") + 1.0))
    
    return df

def preprocess_country_co2(spark, file_path):
    """Processes Country CO2 Emissions Dataset."""
    df = spark.read.csv(file_path, header=True, inferSchema=True)
    
    # Standardize schema and format date
    df = df.withColumn("Formatted_Date", to_date(col("Date"), "dd-MM-yyyy"))
    df = df.withColumn("Year", year(col("Formatted_Date")))
    
    # Remove rows with negative values
    df = df.filter(col("Kilotons of Co2") >= 0)
    
    return df

def preprocess_personal_footprint(spark, file_path):
    """Processes Personal Carbon Footprint Behavior Dataset."""
    df = spark.read.csv(file_path, header=True, inferSchema=True)
    
    # 1. Feature Engineering
    # Calculate non-renewable electricity consumption
    df = df.withColumn(
        "non_renewable_kwh", 
        col("electricity_kwh") * (1.0 - (col("renewable_usage_pct") / 100.0))
    )
    
    # Categorize travel distance
    df = df.withColumn(
        "travel_category",
        when(col("distance_km") < 5.0, "Short")
        .when(col("distance_km") < 15.0, "Medium")
        .otherwise("Long")
    )
    
    return df

def preprocess_vehicle_data(spark, file_path):
    """Processes Vehicle Data Dataset."""
    df = spark.read.csv(file_path, header=True, inferSchema=True)
    
    # Drop column with high missingness (> 50%)
    if "safety_rating_euroncap" in df.columns:
        df = df.drop("safety_rating_euroncap")
    
    # Fill remaining missing numerical columns
    impute_cols = ["cubic_capacity_cc", "cylinders", "gears", "fuel_consumption_city", "fuel_consumption_highway"]
    # Check if columns are present before imputing
    present_cols = [c for c in impute_cols if c in df.columns]
    
    if present_cols:
        imputer = Imputer(inputCols=present_cols, outputCols=present_cols).setStrategy("median")
        df = imputer.fit(df).transform(df)
    
    # Feature Engineering
    df = df.withColumn("power_to_weight", col("power_hp") / (col("curb_weight_kg") + 1.0))
    
    if "is_ev" in df.columns:
        df = df.withColumn(
            "powertrain_type",
            when(col("is_ev") == True, "EV")
            .when(col("is_phev") == True, "PHEV")
            .when(col("is_hybrid") == True, "HEV")
            .otherwise("ICE")
        )
    
    return df
