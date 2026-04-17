from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from src.api.routes import router

app = FastAPI(
    title="FinanceAdvisor API",
    description="AI-Powered Personal Financial Advisor with CrewAI + Gemini",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "FinanceAdvisor API is running",
        "status": "active",
        "currency": "₹ INR",
        "ai_engine": "CrewAI + Gemini"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FinanceAdvisor API"}

# This is the correct way to run uvicorn
if __name__ == "__main__":
    uvicorn.run(
        "server:app",  # This is the import string format
        host="0.0.0.0",
        port=8000,
        reload=True
    )