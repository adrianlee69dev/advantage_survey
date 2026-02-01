from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import users_router, surveys_router, questions_router, responses_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Survey API",
    description="Backend service for creating and answering surveys with role-based access control",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(surveys_router)
app.include_router(questions_router)
app.include_router(responses_router)


@app.get("/")
async def root():
    return {"message": "Survey API", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
