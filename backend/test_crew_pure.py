from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Server is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/auth/login")
def login(data: dict):
    print("Login request:", data)
    return {
        "status": "success",
        "token": "test_token",
        "userId": "123",
        "user": {"name": "Test User", "email": data.get("email")}
    }

@app.post("/api/auth/register")
def register(data: dict):
    print("Register request:", data)
    return {
        "status": "success",
        "token": "test_token",
        "userId": "123",
        "user": {"name": data.get("name"), "email": data.get("email")}
    }

@app.get("/api/users/{user_id}/profile")
def profile(user_id: str):
    return {
        "name": "Test User",
        "email": "test@example.com",
        "monthlyIncome": 50000,
        "monthlyExpenses": 35000
    }

@app.post("/api/expenses")
def add_expense(data: dict):
    return {"status": "success"}

@app.get("/api/expenses/{user_id}")
def get_expenses(user_id: str):
    return {"expenses": [], "count": 0}

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: str):
    return {"status": "success"}

@app.post("/api/goals")
def create_goal(data: dict):
    return {"status": "success"}

@app.get("/api/goals/{user_id}")
def get_goals(user_id: str):
    return {"goals": [], "count": 0}

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: str):
    return {"status": "success"}

@app.post("/api/analyze")
def analyze(data: dict):
    return {
        "status": "success",
        "data": {
            "financial_health": {"score": 75, "recommendations": ["Save more"]},
            "investment_plan": {"monthly_sip": 10000}
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)