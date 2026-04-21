from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
import uvicorn

app = FastAPI()

# CORS - Allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage (replace with MongoDB later)
users_db = {}

SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"

# ============ MODELS ============
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    profile: Optional[Dict] = {}

# ============ ROOT ENDPOINTS ============
@app.get("/")
def root():
    return {"message": "FinanceAdvisor API is running", "status": "active", "version": "1.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ============ AUTH ENDPOINTS ============
@app.post("/api/auth/login")
def login(request: LoginRequest):
    """Login user"""
    print(f"Login attempt: {request.email}")
    
    email = request.email
    password = request.password
    
    # Check if user exists
    user = users_db.get(email)
    
    if not user:
        print(f"User not found: {email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    is_valid = bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
    
    if not is_valid:
        print(f"Invalid password for: {email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = jwt.encode(
        {"email": email, "user_id": user['user_id'], "exp": datetime.utcnow() + timedelta(days=7)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    return {
        "status": "success",
        "token": token,
        "userId": user['user_id'],
        "user": {
            "name": user['name'],
            "email": email,
            "monthlyIncome": user.get('profile', {}).get('monthlyIncome', 50000),
            "monthlyExpenses": user.get('profile', {}).get('monthlyExpenses', 35000),
            "monthlySavings": user.get('profile', {}).get('monthlySavings', 15000),
            "savingsRate": user.get('profile', {}).get('savingsRate', 30),
            "healthScore": user.get('profile', {}).get('healthScore', 65)
        }
    }

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    """Register new user"""
    print(f"Register attempt: {request.email}")
    
    email = request.email
    
    # Check if user already exists
    if email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt())
    
    # Calculate financial metrics
    annual_income = request.profile.get('annualIncome', 600000)
    monthly_income = annual_income / 12
    monthly_expenses = request.profile.get('monthlyExpenses', monthly_income * 0.6)
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
    health_score = min(100, max(0, int(savings_rate + 30)))
    
    # Create user
    user_id = str(len(users_db) + 1)
    users_db[email] = {
        "user_id": user_id,
        "name": request.name,
        "email": email,
        "password": hashed_password.decode('utf-8'),
        "profile": {
            **request.profile,
            "monthlyIncome": monthly_income,
            "monthlyExpenses": monthly_expenses,
            "monthlySavings": monthly_savings,
            "savingsRate": savings_rate,
            "healthScore": health_score
        }
    }
    
    # Create token
    token = jwt.encode(
        {"email": email, "user_id": user_id, "exp": datetime.utcnow() + timedelta(days=7)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    return {
        "status": "success",
        "token": token,
        "userId": user_id,
        "user": {
            "name": request.name,
            "email": email,
            "monthlyIncome": monthly_income,
            "monthlyExpenses": monthly_expenses,
            "monthlySavings": monthly_savings,
            "savingsRate": savings_rate,
            "healthScore": health_score
        }
    }

@app.get("/api/users/{user_id}/profile")
def get_user_profile(user_id: str):
    """Get user profile"""
    # Find user by user_id
    user = None
    for u in users_db.values():
        if u['user_id'] == user_id:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get('profile', {})
    
    return {
        "name": user['name'],
        "email": user['email'],
        "age": profile.get('age', 30),
        "monthlyIncome": profile.get('monthlyIncome', 50000),
        "annualIncome": profile.get('annualIncome', 600000),
        "monthlyExpenses": profile.get('monthlyExpenses', 35000),
        "monthlySavings": profile.get('monthlySavings', 15000),
        "savingsRate": profile.get('savingsRate', 30),
        "healthScore": profile.get('healthScore', 65),
        "job_type": profile.get('job_type', 'Salaried'),
        "marital_status": profile.get('marital_status', 'Single'),
        "children": profile.get('children', 0),
        "risk_tolerance": profile.get('risk_tolerance', 'Moderate')
    }

@app.post("/api/analyze")
def analyze(data: Dict[str, Any]):
    """Analyze finances"""
    user_id = data.get("user_id")
    
    # Find user
    user = None
    for u in users_db.values():
        if u['user_id'] == user_id:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get('profile', {})
    
    monthly_income = profile.get('monthlyIncome', 50000)
    monthly_expenses = profile.get('monthlyExpenses', 35000)
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
    health_score = profile.get('healthScore', min(100, max(0, int(savings_rate + 30))))
    
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

# ============ EXPENSE ENDPOINTS ============
expenses_db = []

@app.post("/api/expenses")
def add_expense(expense_data: Dict[str, Any]):
    """Add expense"""
    expense = {
        "id": str(len(expenses_db) + 1),
        "user_id": expense_data.get("user_id"),
        "amount": expense_data.get("amount"),
        "category": expense_data.get("category"),
        "description": expense_data.get("description", ""),
        "date": expense_data.get("date", datetime.now().strftime("%Y-%m-%d")),
        "payment_method": expense_data.get("payment_method", "Cash")
    }
    expenses_db.append(expense)
    return {"status": "success", "expense_id": expense["id"]}

@app.get("/api/expenses/{user_id}")
def get_expenses(user_id: str):
    """Get expenses"""
    user_expenses = [e for e in expenses_db if e.get("user_id") == user_id]
    return {"status": "success", "expenses": user_expenses, "count": len(user_expenses)}

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: str):
    """Delete expense"""
    global expenses_db
    expenses_db = [e for e in expenses_db if e.get("id") != expense_id]
    return {"status": "success", "message": "Deleted"}

# ============ GOALS ENDPOINTS ============
goals_db = []

@app.post("/api/goals")
def create_goal(goal_data: Dict[str, Any]):
    """Create goal"""
    goal = {
        "id": str(len(goals_db) + 1),
        "user_id": goal_data.get("user_id"),
        "name": goal_data.get("name"),
        "target_amount": goal_data.get("target_amount"),
        "current_amount": goal_data.get("current_amount", 0),
        "deadline": goal_data.get("deadline"),
        "priority": goal_data.get("priority", "Medium"),
        "status": "Active"
    }
    goals_db.append(goal)
    return {"status": "success", "goal_id": goal["id"]}

@app.get("/api/goals/{user_id}")
def get_goals(user_id: str):
    """Get goals"""
    user_goals = [g for g in goals_db if g.get("user_id") == user_id and g.get("status") == "Active"]
    return {"status": "success", "goals": user_goals, "count": len(user_goals)}

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: str):
    """Delete goal"""
    global goals_db
    goals_db = [g for g in goals_db if g.get("id") != goal_id]
    return {"status": "success", "message": "Deleted"}

# ============ CHATBOT ENDPOINT ============
@app.post("/api/chat/message")
def chat_message(data: Dict[str, Any]):
    """Chatbot response"""
    user_message = data.get("message", "")
    return {
        "status": "success",
        "response": f"Thank you for your question. As your AI financial advisor, I recommend tracking your expenses and saving at least 20% of your income."
    }

# ============ DEBUG ENDPOINT ============
@app.get("/api/debug/users")
def debug_users():
    """List all users (for debugging)"""
    users = []
    for email, user in users_db.items():
        users.append({
            "email": email,
            "name": user['name'],
            "user_id": user['user_id']
        })
    return {"users": users, "count": len(users)}

# ============ RUN SERVER ============
if __name__ == "__main__":
    print("🚀 Starting FinanceAdvisor API Server...")
    print("📍 Server will run on: http://localhost:8000")
    print("📍 API Docs: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("📍 Debug Users: http://localhost:8000/api/debug/users")
    print("\n✅ Server is running! Press Ctrl+C to stop.\n")
    
    # Run without reload to avoid warning
    uvicorn.run(
        app,  # Pass the app directly, not as string
        host="0.0.0.0",
        port=8000
    )