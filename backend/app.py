from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uvicorn

# Create app
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
users = {}
expenses = {}
goals = {}
next_id = 1

# ============ ROOT ENDPOINTS ============
@app.get("/")
def root():
    return {
        "message": "FinanceAdvisor API is running!",
        "status": "active",
        "version": "1.0",
        "endpoints": [
            "/health",
            "/api/auth/login",
            "/api/auth/register",
            "/api/users/{user_id}/profile"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "FinanceAdvisor", "timestamp": str(datetime.now())}

# ============ AUTH ENDPOINTS ============
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    profile: Optional[Dict] = {}

@app.post("/api/auth/login")
def login(request: LoginRequest):
    print(f"🔐 Login attempt: {request.email}")
    
    # Find user
    user = users.get(request.email)
    
    if not user:
        print(f"❌ User not found: {request.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user["password"] != request.password:  # Simple check for testing
        print(f"❌ Wrong password for: {request.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    print(f"✅ Login successful: {request.email}")
    
    return {
        "status": "success",
        "token": f"mock_token_{user['user_id']}",
        "userId": user["user_id"],
        "user": {
            "name": user["name"],
            "email": user["email"],
            "monthlyIncome": user.get("profile", {}).get("monthlyIncome", 50000),
            "monthlyExpenses": user.get("profile", {}).get("monthlyExpenses", 35000),
            "monthlySavings": user.get("profile", {}).get("monthlySavings", 15000),
            "savingsRate": user.get("profile", {}).get("savingsRate", 30),
            "healthScore": user.get("profile", {}).get("healthScore", 65)
        }
    }

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    global next_id
    print(f"📝 Register attempt: {request.email}")
    
    # Check if user exists
    if request.email in users:
        print(f"❌ User already exists: {request.email}")
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Calculate financial metrics
    annual_income = request.profile.get("annualIncome", 600000)
    monthly_income = annual_income / 12
    monthly_expenses = request.profile.get("monthlyExpenses", monthly_income * 0.6)
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
    health_score = min(100, max(0, int(savings_rate + 30)))
    
    # Create user
    user_id = str(next_id)
    next_id += 1
    
    users[request.email] = {
        "user_id": user_id,
        "name": request.name,
        "email": request.email,
        "password": request.password,  # In production, hash this!
        "profile": {
            **request.profile,
            "monthlyIncome": monthly_income,
            "monthlyExpenses": monthly_expenses,
            "monthlySavings": monthly_savings,
            "savingsRate": savings_rate,
            "healthScore": health_score
        }
    }
    
    print(f"✅ User created: {request.email} (ID: {user_id})")
    print(f"📊 Total users: {len(users)}")
    
    return {
        "status": "success",
        "token": f"mock_token_{user_id}",
        "userId": user_id,
        "user": {
            "name": request.name,
            "email": request.email,
            "monthlyIncome": monthly_income,
            "monthlyExpenses": monthly_expenses,
            "monthlySavings": monthly_savings,
            "savingsRate": savings_rate,
            "healthScore": health_score
        }
    }

# ============ PROFILE ENDPOINT ============
@app.get("/api/users/{user_id}/profile")
def get_profile(user_id: str):
    print(f"👤 Profile request for user_id: {user_id}")
    
    # Find user by user_id
    user = None
    for u in users.values():
        if u["user_id"] == user_id:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get("profile", {})
    
    return {
        "name": user["name"],
        "email": user["email"],
        "age": profile.get("age", 30),
        "monthlyIncome": profile.get("monthlyIncome", 50000),
        "annualIncome": profile.get("annualIncome", 600000),
        "monthlyExpenses": profile.get("monthlyExpenses", 35000),
        "monthlySavings": profile.get("monthlySavings", 15000),
        "savingsRate": profile.get("savingsRate", 30),
        "healthScore": profile.get("healthScore", 65),
        "job_type": profile.get("job_type", "Salaried"),
        "marital_status": profile.get("marital_status", "Single"),
        "children": profile.get("children", 0),
        "risk_tolerance": profile.get("risk_tolerance", "Moderate")
    }

# ============ EXPENSE ENDPOINTS ============
expense_list = []

@app.post("/api/expenses")
def add_expense(data: Dict[str, Any]):
    expense_id = str(len(expense_list) + 1)
    expense = {
        "_id": expense_id,
        "user_id": data.get("user_id"),
        "amount": data.get("amount"),
        "category": data.get("category"),
        "description": data.get("description", ""),
        "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
        "payment_method": data.get("payment_method", "Cash")
    }
    expense_list.append(expense)
    return {"status": "success", "expense_id": expense_id}

@app.get("/api/expenses/{user_id}")
def get_expenses(user_id: str):
    user_expenses = [e for e in expense_list if e.get("user_id") == user_id]
    return {"status": "success", "expenses": user_expenses, "count": len(user_expenses)}

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: str):
    global expense_list
    expense_list = [e for e in expense_list if e.get("_id") != expense_id]
    return {"status": "success", "message": "Deleted"}

# ============ GOALS ENDPOINTS ============
goal_list = []

@app.post("/api/goals")
def create_goal(data: Dict[str, Any]):
    goal_id = str(len(goal_list) + 1)
    goal = {
        "_id": goal_id,
        "user_id": data.get("user_id"),
        "name": data.get("name"),
        "target_amount": data.get("target_amount"),
        "current_amount": data.get("current_amount", 0),
        "deadline": data.get("deadline"),
        "priority": data.get("priority", "Medium"),
        "status": "Active"
    }
    goal_list.append(goal)
    return {"status": "success", "goal_id": goal_id}

@app.get("/api/goals/{user_id}")
def get_goals(user_id: str):
    user_goals = [g for g in goal_list if g.get("user_id") == user_id and g.get("status") == "Active"]
    return {"status": "success", "goals": user_goals, "count": len(user_goals)}

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: str):
    global goal_list
    goal_list = [g for g in goal_list if g.get("_id") != goal_id]
    return {"status": "success", "message": "Deleted"}

# ============ ANALYSIS ENDPOINT ============
@app.post("/api/analyze")
def analyze(data: Dict[str, Any]):
    user_id = data.get("user_id")
    
    # Find user
    user = None
    for u in users.values():
        if u["user_id"] == user_id:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get("profile", {})
    monthly_income = profile.get("monthlyIncome", 50000)
    monthly_expenses = profile.get("monthlyExpenses", 35000)
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
    health_score = profile.get("healthScore", min(100, max(0, int(savings_rate + 30))))
    
    return {
        "status": "success",
        "data": {
            "financial_health": {
                "score": health_score,
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "monthly_savings": monthly_savings,
                "savings_rate": round(savings_rate, 1),
                "recommendations": [
                    "Track expenses regularly",
                    "Aim to save at least 20% of your income",
                    "Build emergency fund of 6 months expenses",
                    "Start SIP in diversified mutual funds"
                ]
            },
            "investment_plan": {
                "allocation": {"Equity": 50, "Debt": 30, "Gold": 10, "Cash": 10},
                "expected_return": "12-15%",
                "monthly_sip": monthly_savings * 0.7
            }
        }
    }

# ============ CHATBOT ENDPOINT ============
@app.post("/api/chat/message")
def chat(data: Dict[str, Any]):
    message = data.get("message", "")
    return {
        "status": "success",
        "response": f"Thanks for your question. As your AI financial advisor, I recommend saving at least 20% of your income and starting a SIP in diversified mutual funds."
    }

# ============ DEBUG ENDPOINTS ============
@app.get("/api/debug/users")
def debug_users():
    user_list = []
    for email, user in users.items():
        user_list.append({
            "email": email,
            "name": user["name"],
            "user_id": user["user_id"]
        })
    return {"users": user_list, "count": len(user_list)}

@app.get("/api/debug/routes")
def debug_routes():
    return {
        "available_endpoints": [
            "GET /",
            "GET /health",
            "POST /api/auth/login",
            "POST /api/auth/register",
            "GET /api/users/{user_id}/profile",
            "POST /api/expenses",
            "GET /api/expenses/{user_id}",
            "DELETE /api/expenses/{expense_id}",
            "POST /api/goals",
            "GET /api/goals/{user_id}",
            "DELETE /api/goals/{goal_id}",
            "POST /api/analyze",
            "POST /api/chat/message",
            "GET /api/debug/users",
            "GET /api/debug/routes"
        ]
    }

# ============ RUN SERVER ============
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 FINANCEADVISOR API SERVER")
    print("="*60)
    print(f"📍 Server URL: http://localhost:8000")
    print(f"📍 Health Check: http://localhost:8000/health")
    print(f"📍 Debug Routes: http://localhost:8000/api/debug/routes")
    print(f"📍 Debug Users: http://localhost:8000/api/debug/users")
    print("="*60)
    print("\n✅ Server is ready to accept requests!\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False
    )