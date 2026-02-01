import os
from pydantic_settings import BaseSettings

# Get the backend directory path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Settings(BaseSettings):
    database_url: str = f"sqlite+aiosqlite:///{os.path.join(BASE_DIR, 'survey.db')}"
    
    class Config:
        env_file = ".env"


settings = Settings()
