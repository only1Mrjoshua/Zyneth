from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import routers
from routers import users
from routers import auth  # NEW: Import auth router

app = FastAPI()

# Static files
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS middleware - UPDATED to include more origins and cookie support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500", 
        "http://127.0.0.1:5500",
        "https://zyneth.shop",           
        "https://www.zyneth.shop",       
        "https://zyneth-backend.onrender.com",
        "http://localhost:8000",  # For local development
    ],
    allow_credentials=True,  # Important for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(auth.router)  # NEW: Include auth router

@app.get("/")
async def root():
    return {"message": "LMS API"}

@app.get("/health")
async def health():
    return {"status": "ok"}