from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    footprints = relationship("CarbonFootprintLog", back_populates="user", cascade="all, delete-orphan")

class CarbonFootprintLog(Base):
    __tablename__ = "carbon_footprint_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    day_type = Column(String, nullable=False)  # Weekday / Weekend
    transport_mode = Column(String, nullable=False)  # Bike, Public Transit, Car, Walk, Electric Vehicle
    distance_km = Column(Float, nullable=False)
    electricity_kwh = Column(Float, nullable=False)
    renewable_usage_pct = Column(Integer, nullable=False)
    food_type = Column(String, nullable=False)  # Non-Veg, Veg, Vegan
    screen_time_hours = Column(Float, nullable=False)
    waste_generated_kg = Column(Float, nullable=False)
    eco_actions = Column(Integer, nullable=False)
    carbon_footprint_kg = Column(Float, nullable=False)
    carbon_impact_level = Column(String, nullable=False)  # Low, Medium, High

    user = relationship("User", back_populates="footprints")
