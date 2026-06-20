import os

class Settings:
    PROJECT_NAME: str = "EcoTwin AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "supersecretkeyforecotwinai_dontreveal"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./eco.db"
    )

    GEMINI_API_KEY: str = os.getenv(
        "GEMINI_API_KEY",
        ""
    )

settings = Settings()
