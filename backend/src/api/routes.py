from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import bcrypt

load_dotenv()

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "financeadvisor")

# MongoDB Connection
try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client[DATABASE_NAME]
    users_collection = db.users
    expenses_collection = db.expenses
    goals_collection = db.goals
    print("✅ Connected to MongoDB")
    print(f"📊 Database: {DATABASE_NAME}")
    print(f"📁 Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    mongo_client = None
    db = None
    users_collection = None
    expenses_collection = None
    goals_collection = None

def create_token(user_id: str, email: str):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        raise HTTPException(status_code=403, detail="Invalid token")

# ============ AUTH ROUTES ============
@router.post("/auth/register")
async def register_user(user_data: Dict[str, Any]):
    try:
        email = user_data.get("email")
        
        # Check if user exists
        if users_collection is not None:
            existing_user = users_collection.find_one({"email": email})
            if existing_user:
                raise HTTPException(status_code=400, detail="User already exists")
        
        # Calculate financial metrics
        annual_income = float(user_data.get("profile", {}).get("annualIncome", 0))
        monthly_income = annual_income / 12 if annual_income > 0 else 0
        monthly_expenses = float(user_data.get("profile", {}).get("monthlyExpenses", monthly_income * 0.6))
        monthly_savings = monthly_income - monthly_expenses
        savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
        health_score = min(100, max(0, int(savings_rate + 30)))
        
        # Hash password
        hashed_password = bcrypt.hashpw(user_data.get("password").encode('utf-8'), bcrypt.gensalt())
        
        # Create user document
        user = {
            "email": email,
            "name": user_data.get("name"),
            "password": hashed_password.decode('utf-8'),
            "profile": {
                **user_data.get("profile", {}),
                "monthlyIncome": monthly_income,
                "monthlyExpenses": monthly_expenses,
                "monthlySavings": monthly_savings,
                "savingsRate": savings_rate,
                "healthScore": health_score,
                "registeredAt": datetime.now()
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert user
        if users_collection is not None:
            result = users_collection.insert_one(user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(hash(email))
        
        # Create token
        token = create_token(user_id, email)
        
        return {
            "status": "success",
            "token": token,
            "userId": user_id,
            "user": {
                "name": user.get("name"),
                "email": email,
                "monthlyIncome": monthly_income,
                "monthlyExpenses": monthly_expenses,
                "monthlySavings": monthly_savings,
                "savingsRate": savings_rate,
                "healthScore": health_score
            }
        }
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
async def login_user(login_data: Dict[str, Any]):
    try:
        email = login_data.get("email")
        password = login_data.get("password")
        
        print(f"Login attempt for email: {email}")
        
        # Find user by email
        user = None
        if users_collection is not None:
            user = users_collection.find_one({"email": email})
            print(f"User found: {user is not None}")
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        is_password_valid = bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
        print(f"Password valid: {is_password_valid}")
        
        if not is_password_valid:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Get user ID as string
        user_id = str(user['_id'])
        
        # Get profile data
        profile = user.get('profile', {})
        monthly_income = profile.get('monthlyIncome', 0)
        monthly_expenses = profile.get('monthlyExpenses', 0)
        monthly_savings = profile.get('monthlySavings', 0)
        savings_rate = profile.get('savingsRate', 0)
        health_score = profile.get('healthScore', 50)
        
        # Create token
        token = create_token(user_id, email)
        
        return {
            "status": "success",
            "token": token,
            "userId": user_id,
            "user": {
                "name": user.get('name'),
                "email": email,
                "monthlyIncome": monthly_income,
                "monthlyExpenses": monthly_expenses,
                "monthlySavings": monthly_savings,
                "savingsRate": savings_rate,
                "healthScore": health_score,
                "age": profile.get('age', 30),
                "job_type": profile.get('job_type', 'Salaried')
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ TEST USER ENDPOINT ============
@router.post("/auth/create-test-user")
async def create_test_user():
    """Create a test user for debugging"""
    try:
        email = "test@example.com"
        
        # Check if user exists
        if users_collection is not None:
            existing_user = users_collection.find_one({"email": email})
            if existing_user:
                return {"message": "Test user already exists", "email": email}
        
        # Create test user
        hashed_password = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt())
        
        test_user = {
            "email": email,
            "name": "Test User",
            "password": hashed_password.decode('utf-8'),
            "profile": {
                "age": 30,
                "annualIncome": 1200000,
                "monthlyIncome": 100000,
                "monthlyExpenses": 35000,
                "monthlySavings": 65000,
                "savingsRate": 65,
                "healthScore": 85,
                "job_type": "Salaried",
                "marital_status": "Single",
                "children": 0,
                "risk_tolerance": "Moderate",
                "registeredAt": datetime.now()
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = users_collection.insert_one(test_user)
        
        return {
            "message": "Test user created successfully",
            "email": email,
            "password": "test123",
            "userId": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Create test user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ EXPENSE ROUTES ============
@router.post("/expenses")
async def add_expense(expense_data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    try:
        expense = {
            "user_id": expense_data.get("user_id"),
            "amount": float(expense_data.get("amount")),
            "category": expense_data.get("category"),
            "description": expense_data.get("description", ""),
            "date": datetime.now(),
            "payment_method": expense_data.get("payment_method", "Cash"),
            "created_at": datetime.now()
        }
        
        if expenses_collection is not None:
            result = expenses_collection.insert_one(expense)
            return {"status": "success", "expense_id": str(result.inserted_id)}
        else:
            return {"status": "error", "message": "Database not connected"}
    except Exception as e:
        print(f"Add expense error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expenses/{user_id}")
async def get_user_expenses(user_id: str, token_data: dict = Depends(verify_token)):
    try:
        expenses = []
        if expenses_collection is not None:
            for exp in expenses_collection.find({"user_id": user_id}).sort("date", -1):
                exp['_id'] = str(exp['_id'])
                exp['date'] = exp['date'].strftime("%Y-%m-%d") if exp.get('date') else None
                expenses.append(exp)
        return {"status": "success", "expenses": expenses, "count": len(expenses)}
    except Exception as e:
        print(f"Get expenses error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, token_data: dict = Depends(verify_token)):
    try:
        if expenses_collection is not None:
            result = expenses_collection.delete_one({"_id": ObjectId(expense_id)})
            if result.deleted_count > 0:
                return {"status": "success", "message": "Deleted"}
            else:
                raise HTTPException(status_code=404, detail="Expense not found")
        else:
            raise HTTPException(status_code=500, detail="Database not connected")
    except Exception as e:
        print(f"Delete expense error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ GOALS ROUTES ============
@router.post("/goals")
async def create_goal(goal_data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    try:
        goal = {
            "user_id": goal_data.get("user_id"),
            "name": goal_data.get("name"),
            "target_amount": float(goal_data.get("target_amount")),
            "current_amount": float(goal_data.get("current_amount", 0)),
            "deadline": goal_data.get("deadline"),
            "priority": goal_data.get("priority", "Medium"),
            "status": "Active",
            "created_at": datetime.now()
        }
        
        if goals_collection is not None:
            result = goals_collection.insert_one(goal)
            return {"status": "success", "goal_id": str(result.inserted_id)}
        else:
            return {"status": "error", "message": "Database not connected"}
    except Exception as e:
        print(f"Create goal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals/{user_id}")
async def get_user_goals(user_id: str, token_data: dict = Depends(verify_token)):
    try:
        goals = []
        if goals_collection is not None:
            for goal in goals_collection.find({"user_id": user_id, "status": "Active"}):
                goal['_id'] = str(goal['_id'])
                goals.append(goal)
        return {"status": "success", "goals": goals, "count": len(goals)}
    except Exception as e:
        print(f"Get goals error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, token_data: dict = Depends(verify_token)):
    try:
        if goals_collection is not None:
            result = goals_collection.delete_one({"_id": ObjectId(goal_id)})
            if result.deleted_count > 0:
                return {"status": "success", "message": "Goal deleted successfully"}
            else:
                raise HTTPException(status_code=404, detail="Goal not found")
        else:
            raise HTTPException(status_code=500, detail="Database not connected")
    except Exception as e:
        print(f"Delete goal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ PROFILE ROUTE ============
@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, token_data: dict = Depends(verify_token)):
    try:
        if users_collection is not None:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            profile = user.get('profile', {})
            
            return {
                "name": user.get('name'),
                "email": user.get('email'),
                "age": profile.get('age', 30),
                "monthlyIncome": profile.get('monthlyIncome', 0),
                "annualIncome": profile.get('annualIncome', 0),
                "monthlyExpenses": profile.get('monthlyExpenses', 0),
                "monthlySavings": profile.get('monthlySavings', 0),
                "savingsRate": profile.get('savingsRate', 0),
                "healthScore": profile.get('healthScore', 50),
                "job_type": profile.get('job_type', 'Salaried'),
                "marital_status": profile.get('marital_status', 'Single'),
                "children": profile.get('children', 0),
                "risk_tolerance": profile.get('risk_tolerance', 'Moderate')
            }
        else:
            raise HTTPException(status_code=500, detail="Database not connected")
    except Exception as e:
        print(f"Profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ ANALYSIS ROUTE ============
@router.post("/analyze")
async def analyze_finances(data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    try:
        user_id = data.get("user_id")
        
        if users_collection is not None:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
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
                            "Track expenses regularly using the Expense Manager",
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
        else:
            raise HTTPException(status_code=500, detail="Database not connected")
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoint
@router.get("/debug/users")
async def debug_users():
    """Debug endpoint to see all users"""
    if users_collection is not None:
        users = []
        for user in users_collection.find():
            users.append({
                "id": str(user['_id']),
                "email": user.get('email'),
                "name": user.get('name'),
                "has_password": user.get('password') is not None
            })
        return {"users": users, "count": len(users)}
    else:
        return {"error": "Database not connected"}