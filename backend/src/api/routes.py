from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List
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
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.JWTError:
        raise HTTPException(status_code=403, detail="Invalid authentication token")

# ============ AUTH ROUTES ============
@router.post("/auth/register")
async def register_user(user_data: Dict[str, Any]):
    """Register a new user"""
    try:
        email = user_data.get("email")
        
        # Check if user exists - FIXED: compare with None
        if users_collection is not None:
            existing_user = users_collection.find_one({"email": email})
            if existing_user:
                raise HTTPException(status_code=400, detail="User already exists")
        
        password = user_data.get("password")
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user = {
            "email": email,
            "name": user_data.get("name"),
            "password": hashed_password.decode('utf-8'),
            "profile": user_data.get("profile", {}),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert user - FIXED: compare with None
        if users_collection is not None:
            result = users_collection.insert_one(user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(hash(email))
        
        token = create_token(user_id, email)
        
        return {
            "status": "success",
            "token": token,
            "userId": user_id,
            "message": "User registered successfully"
        }
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
async def login_user(login_data: Dict[str, Any]):
    """Login user"""
    try:
        email = login_data.get("email")
        password = login_data.get("password")
        
        # Find user - FIXED: compare with None
        user = None
        if users_collection is not None:
            user = users_collection.find_one({"email": email})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            user_id = str(user['_id'])
            token = create_token(user_id, email)
            
            return {
                "status": "success",
                "token": token,
                "userId": user_id,
                "user": {
                    "name": user.get('name'),
                    "email": email
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, token_data: dict = Depends(verify_token)):
    """Get user profile"""
    try:
        user = None
        # FIXED: compare with None
        if users_collection is not None:
            try:
                user = users_collection.find_one({"_id": ObjectId(user_id)})
            except:
                user = users_collection.find_one({"id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        monthly_income = user.get('profile', {}).get('annualIncome', 60000) / 12
        
        return {
            "name": user.get('name'),
            "email": user.get('email'),
            "age": user.get('profile', {}).get('age', 30),
            "monthlyIncome": monthly_income,
            "annualIncome": user.get('profile', {}).get('annualIncome', 60000)
        }
    except Exception as e:
        print(f"Profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ EXPENSE ROUTES ============
@router.post("/expenses")
async def add_expense(expense_data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    """Add a new expense"""
    try:
        print(f"Received expense data: {expense_data}")
        
        # Validate required fields
        if not expense_data.get("user_id"):
            raise HTTPException(status_code=400, detail="user_id is required")
        if not expense_data.get("amount") or float(expense_data.get("amount")) <= 0:
            raise HTTPException(status_code=400, detail="Valid amount is required")
        
        # Prepare expense document
        expense = {
            "user_id": expense_data.get("user_id"),
            "amount": float(expense_data.get("amount")),
            "category": expense_data.get("category", "Other"),
            "description": expense_data.get("description", ""),
            "date": datetime.now(),
            "payment_method": expense_data.get("payment_method", "Cash"),
            "created_at": datetime.now()
        }
        
        # If date is provided, use it
        if expense_data.get("date"):
            try:
                expense["date"] = datetime.strptime(expense_data.get("date"), "%Y-%m-%d")
            except:
                pass
        
        print(f"Saving expense: {expense}")
        
        # Save to database - FIXED: compare with None
        if expenses_collection is not None:
            result = expenses_collection.insert_one(expense)
            expense_id = str(result.inserted_id)
            
            print(f"Expense saved with ID: {expense_id}")
            
            return {
                "status": "success",
                "expense_id": expense_id,
                "message": "Expense added successfully"
            }
        else:
            return {
                "status": "error", 
                "message": "Database not connected. Please check MongoDB."
            }
            
    except Exception as e:
        print(f"Add expense error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expenses/{user_id}")
async def get_user_expenses(user_id: str, token_data: dict = Depends(verify_token)):
    """Get all expenses for a user"""
    try:
        expenses = []
        # FIXED: compare with None
        if expenses_collection is not None:
            for expense in expenses_collection.find({"user_id": user_id}).sort("date", -1):
                expense['_id'] = str(expense['_id'])
                if expense.get('date'):
                    expense['date'] = expense['date'].strftime("%Y-%m-%d")
                expenses.append(expense)
        
        return {
            "status": "success",
            "expenses": expenses,
            "count": len(expenses)
        }
    except Exception as e:
        print(f"Get expenses error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, token_data: dict = Depends(verify_token)):
    """Delete an expense"""
    try:
        # FIXED: compare with None
        if expenses_collection is not None:
            result = expenses_collection.delete_one({"_id": ObjectId(expense_id)})
            if result.deleted_count > 0:
                return {
                    "status": "success",
                    "message": "Expense deleted successfully"
                }
            else:
                raise HTTPException(status_code=404, detail="Expense not found")
        else:
            raise HTTPException(status_code=500, detail="Database not connected")
    except Exception as e:
        print(f"Delete expense error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expenses/summary/{user_id}")
async def get_expense_summary(user_id: str, token_data: dict = Depends(verify_token)):
    """Get expense summary by category"""
    try:
        summary = []
        monthly_total = 0
        
        # FIXED: compare with None
        if expenses_collection is not None:
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$category",
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"total": -1}}
            ]
            
            for item in expenses_collection.aggregate(pipeline):
                summary.append({
                    "category": item["_id"],
                    "total": item["total"],
                    "count": item["count"]
                })
            
            # Get monthly total
            current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = (current_month.replace(day=28) + timedelta(days=4)).replace(day=1)
            
            monthly_pipeline = [
                {
                    "$match": {
                        "user_id": user_id,
                        "date": {"$gte": current_month, "$lt": next_month}
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            
            result = list(expenses_collection.aggregate(monthly_pipeline))
            if result:
                monthly_total = result[0]["total"]
        
        return {
            "status": "success",
            "summary": summary,
            "monthly_total": monthly_total
        }
    except Exception as e:
        print(f"Summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ GOALS ROUTES ============
@router.post("/goals")
async def create_goal(goal_data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    """Create a new financial goal"""
    try:
        goal = {
            "user_id": goal_data.get("user_id"),
            "name": goal_data.get("name"),
            "target_amount": float(goal_data.get("target_amount")),
            "current_amount": float(goal_data.get("current_amount", 0)),
            "deadline": datetime.strptime(goal_data.get("deadline"), "%Y-%m-%d") if goal_data.get("deadline") else None,
            "priority": goal_data.get("priority", "Medium"),
            "status": "Active",
            "created_at": datetime.now()
        }
        
        # FIXED: compare with None
        if goals_collection is not None:
            result = goals_collection.insert_one(goal)
            goal_id = str(result.inserted_id)
            
            return {
                "status": "success",
                "goal_id": goal_id,
                "message": "Goal created successfully"
            }
        else:
            return {"status": "error", "message": "Database not connected"}
    except Exception as e:
        print(f"Create goal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals/{user_id}")
async def get_user_goals(user_id: str, token_data: dict = Depends(verify_token)):
    """Get all goals for a user"""
    try:
        goals = []
        # FIXED: compare with None
        if goals_collection is not None:
            for goal in goals_collection.find({"user_id": user_id, "status": "Active"}):
                goal['_id'] = str(goal['_id'])
                if goal.get('deadline'):
                    goal['deadline'] = goal['deadline'].strftime("%Y-%m-%d")
                goals.append(goal)
        
        return {
            "status": "success",
            "goals": goals,
            "count": len(goals)
        }
    except Exception as e:
        print(f"Get goals error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ ANALYSIS ROUTE ============
@router.post("/analyze")
async def analyze_finances(data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    """Analyze user's financial data"""
    try:
        user_id = data.get("user_id")
        financial_data = data.get("financial_data", {})
        
        # Get actual expenses from database
        total_expenses = 0
        monthly_expenses = financial_data.get("monthly_expenses", 35000)
        
        # FIXED: compare with None
        if expenses_collection is not None:
            expenses = list(expenses_collection.find({"user_id": user_id}))
            total_expenses = sum(e.get('amount', 0) for e in expenses)
            if len(expenses) > 0:
                monthly_expenses = total_expenses / 12
        
        monthly_income = financial_data.get("monthly_income", 50000)
        monthly_savings = monthly_income - monthly_expenses
        
        return {
            "status": "success",
            "data": {
                "analysis": f"""
                📊 Financial Analysis (₹ INR):
                - Monthly Income: ₹{monthly_income:,.2f}
                - Monthly Expenses: ₹{monthly_expenses:,.2f}
                - Monthly Savings: ₹{monthly_savings:,.2f}
                - Savings Rate: {(monthly_savings/monthly_income)*100:.1f}%
                
                💡 Recommendations:
                1. Build emergency fund of ₹{monthly_expenses * 6:,.2f}
                2. Start SIP of ₹{monthly_savings * 0.7:,.2f} in mutual funds
                3. Consider PPF for tax-saving under Section 80C
                4. Review and optimize expense categories
                5. Set up automatic monthly transfers to savings
                """,
                "financial_health": {
                    "score": 75,
                    "monthly_income": monthly_income,
                    "monthly_expenses": monthly_expenses,
                    "monthly_savings": monthly_savings,
                    "recommendations": [
                        "Track expenses regularly",
                        "Reduce discretionary spending by 10%",
                        "Build 6 months emergency fund",
                        "Start systematic investment plan (SIP)"
                    ]
                },
                "investment_plan": {
                    "allocation": {
                        "Equity Mutual Funds": "50%",
                        "Debt (PPF/EPF/FD)": "30%",
                        "Gold (SGB)": "10%",
                        "Emergency Cash": "10%"
                    },
                    "expected_return": "10-12% annually",
                    "monthly_sip": monthly_savings * 0.7
                }
            }
        }
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoint to check database status
@router.get("/debug/db")
async def debug_db():
    """Check database connection status"""
    status = {
        "mongodb_connected": expenses_collection is not None,
        "database_name": DATABASE_NAME,
        "collections": db.list_collection_names() if db is not None else [],
        "expenses_count": expenses_collection.count_documents({}) if expenses_collection is not None else 0,
        "users_count": users_collection.count_documents({}) if users_collection is not None else 0
    }
    return status