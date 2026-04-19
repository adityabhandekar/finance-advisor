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

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "financeadvisor")

# MongoDB Connection
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client[DATABASE_NAME]
users_collection = db.users
expenses_collection = db.expenses
goals_collection = db.goals

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

def calculate_financial_metrics(user_id: str):
    """Calculate real-time financial metrics from actual data"""
    # Get user
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None
    
    profile = user.get('profile', {})
    monthly_income = profile.get('monthlyIncome', 0)
    
    # Get all expenses
    expenses = list(expenses_collection.find({"user_id": user_id}))
    
    # Calculate total expenses
    total_expenses_all_time = sum(e.get('amount', 0) for e in expenses)
    
    # Calculate average monthly expenses
    if len(expenses) > 0:
        # Get date range
        dates = [e.get('date', datetime.now()) for e in expenses if e.get('date')]
        if dates:
            min_date = min(dates)
            max_date = max(dates)
            months_diff = max(1, (max_date - min_date).days / 30)
            monthly_expenses = total_expenses_all_time / months_diff
        else:
            monthly_expenses = profile.get('monthlyExpenses', monthly_income * 0.6)
    else:
        monthly_expenses = profile.get('monthlyExpenses', monthly_income * 0.6)
    
    # Calculate current month expenses
    current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_month_expenses = sum(e.get('amount', 0) for e in expenses if e.get('date', datetime.now()) >= current_month)
    
    # Calculate savings
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
    
    # Calculate health score
    health_score = min(100, max(0, int(savings_rate + 30)))
    
    # Update user profile with calculated metrics
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "profile.monthlyExpenses": monthly_expenses,
            "profile.monthlySavings": monthly_savings,
            "profile.savingsRate": savings_rate,
            "profile.healthScore": health_score,
            "profile.totalExpenses": total_expenses_all_time,
            "profile.currentMonthExpenses": current_month_expenses,
            "profile.lastCalculated": datetime.now()
        }}
    )
    
    return {
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_savings": monthly_savings,
        "savings_rate": round(savings_rate, 1),
        "health_score": health_score,
        "total_expenses": total_expenses_all_time,
        "current_month_expenses": current_month_expenses,
        "transaction_count": len(expenses)
    }

# ============ AUTH ROUTES ============
@router.post("/auth/register")
async def register_user(user_data: Dict[str, Any]):
    try:
        email = user_data.get("email")
        if users_collection.find_one({"email": email}):
            raise HTTPException(status_code=400, detail="User exists")
        
        annual_income = float(user_data.get("profile", {}).get("annualIncome", 0))
        monthly_income = annual_income / 12
        monthly_expenses = float(user_data.get("profile", {}).get("monthlyExpenses", monthly_income * 0.6))
        
        hashed = bcrypt.hashpw(user_data.get("password").encode(), bcrypt.gensalt())
        user = {
            "email": email,
            "name": user_data.get("name"),
            "password": hashed.decode(),
            "profile": {
                **user_data.get("profile", {}),
                "monthlyIncome": monthly_income,
                "monthlyExpenses": monthly_expenses,
                "monthlySavings": monthly_income - monthly_expenses,
                "savingsRate": ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0,
                "healthScore": 50,
                "registeredAt": datetime.now()
            },
            "created_at": datetime.now()
        }
        result = users_collection.insert_one(user)
        token = create_token(str(result.inserted_id), email)
        
        # Calculate initial metrics
        metrics = calculate_financial_metrics(str(result.inserted_id))
        
        return {
            "status": "success", 
            "token": token, 
            "userId": str(result.inserted_id),
            "user": {
                "name": user.get("name"),
                "email": email,
                "monthlyIncome": monthly_income,
                "monthlyExpenses": monthly_expenses,
                "monthlySavings": monthly_income - monthly_expenses,
                "savingsRate": ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0,
                "healthScore": metrics['health_score'] if metrics else 50
            }
        }
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
async def login_user(login_data: Dict[str, Any]):
    try:
        user = users_collection.find_one({"email": login_data.get("email")})
        if not user or not bcrypt.checkpw(login_data.get("password").encode(), user['password'].encode()):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_token(str(user['_id']), user['email'])
        
        # Calculate real-time metrics
        metrics = calculate_financial_metrics(str(user['_id']))
        
        profile = user.get('profile', {})
        
        return {
            "status": "success", 
            "token": token, 
            "userId": str(user['_id']),
            "user": {
                "name": user.get('name'),
                "email": user['email'],
                "monthlyIncome": metrics['monthly_income'] if metrics else profile.get('monthlyIncome', 0),
                "monthlyExpenses": metrics['monthly_expenses'] if metrics else profile.get('monthlyExpenses', 0),
                "monthlySavings": metrics['monthly_savings'] if metrics else 0,
                "savingsRate": metrics['savings_rate'] if metrics else 0,
                "healthScore": metrics['health_score'] if metrics else 50,
                "age": profile.get('age', 30),
                "job_type": profile.get('job_type', 'Salaried')
            }
        }
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, token_data: dict = Depends(verify_token)):
    try:
        # Calculate real-time metrics
        metrics = calculate_financial_metrics(user_id)
        
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile = user.get('profile', {})
        
        return {
            "name": user.get('name'),
            "email": user.get('email'),
            "age": profile.get('age', 30),
            "monthlyIncome": metrics['monthly_income'] if metrics else profile.get('monthlyIncome', 0),
            "annualIncome": profile.get('annualIncome', 0),
            "monthlyExpenses": metrics['monthly_expenses'] if metrics else profile.get('monthlyExpenses', 0),
            "monthlySavings": metrics['monthly_savings'] if metrics else 0,
            "savingsRate": metrics['savings_rate'] if metrics else 0,
            "healthScore": metrics['health_score'] if metrics else 50,
            "totalExpenses": metrics['total_expenses'] if metrics else 0,
            "currentMonthExpenses": metrics['current_month_expenses'] if metrics else 0,
            "transactionCount": metrics['transaction_count'] if metrics else 0,
            "job_type": profile.get('job_type', 'Salaried'),
            "marital_status": profile.get('marital_status', 'Single'),
            "children": profile.get('children', 0),
            "risk_tolerance": profile.get('risk_tolerance', 'Moderate')
        }
    except Exception as e:
        print(f"Profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/profile")
async def update_user_profile(user_id: str, profile_data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_profile = user.get('profile', {})
        update_fields = {}
        
        if "name" in profile_data:
            update_fields["name"] = profile_data["name"]
        
        if "annualIncome" in profile_data:
            annual_income = float(profile_data["annualIncome"])
            update_fields["profile.annualIncome"] = annual_income
            update_fields["profile.monthlyIncome"] = annual_income / 12
        
        if "monthlyExpenses" in profile_data:
            update_fields["profile.monthlyExpenses"] = float(profile_data["monthlyExpenses"])
        
        if "age" in profile_data:
            update_fields["profile.age"] = int(profile_data["age"])
        
        if "job_type" in profile_data:
            update_fields["profile.job_type"] = profile_data["job_type"]
        
        if "marital_status" in profile_data:
            update_fields["profile.marital_status"] = profile_data["marital_status"]
        
        if "children" in profile_data:
            update_fields["profile.children"] = int(profile_data["children"])
        
        if "risk_tolerance" in profile_data:
            update_fields["profile.risk_tolerance"] = profile_data["risk_tolerance"]
        
        update_fields["updated_at"] = datetime.now()
        
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )
        
        # Recalculate metrics
        metrics = calculate_financial_metrics(user_id)
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "metrics": metrics
        }
    except Exception as e:
        print(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/financial-summary")
async def get_financial_summary(user_id: str, token_data: dict = Depends(verify_token)):
    """Get real-time financial summary with calculations"""
    try:
        metrics = calculate_financial_metrics(user_id)
        
        if not metrics:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get goals
        goals = list(goals_collection.find({"user_id": user_id, "status": "Active"}))
        
        return {
            "status": "success",
            "summary": metrics,
            "goals": {
                "count": len(goals),
                "total_target": sum(g.get('target_amount', 0) for g in goals),
                "total_current": sum(g.get('current_amount', 0) for g in goals)
            }
        }
    except Exception as e:
        print(f"Financial summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ EXPENSE ROUTES ============
@router.post("/expenses")
async def add_expense(expense_data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    try:
        user_id = expense_data.get("user_id")
        
        expense = {
            "user_id": user_id,
            "amount": float(expense_data.get("amount")),
            "category": expense_data.get("category"),
            "description": expense_data.get("description", ""),
            "date": datetime.now(),
            "payment_method": expense_data.get("payment_method", "Cash")
        }
        result = expenses_collection.insert_one(expense)
        
        # Recalculate financial metrics after adding expense
        calculate_financial_metrics(user_id)
        
        return {"status": "success", "expense_id": str(result.inserted_id)}
    except Exception as e:
        print(f"Add expense error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expenses/{user_id}")
async def get_user_expenses(user_id: str, token_data: dict = Depends(verify_token)):
    try:
        expenses = []
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
        expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
        if expense:
            user_id = expense.get("user_id")
            expenses_collection.delete_one({"_id": ObjectId(expense_id)})
            
            # Recalculate financial metrics after deleting expense
            calculate_financial_metrics(user_id)
        
        return {"status": "success", "message": "Deleted"}
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
        result = goals_collection.insert_one(goal)
        return {"status": "success", "goal_id": str(result.inserted_id)}
    except Exception as e:
        print(f"Create goal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals/{user_id}")
async def get_user_goals(user_id: str, token_data: dict = Depends(verify_token)):
    try:
        goals = []
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
        result = goals_collection.delete_one({"_id": ObjectId(goal_id)})
        if result.deleted_count > 0:
            return {"status": "success", "message": "Goal deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Goal not found")
    except Exception as e:
        print(f"Delete goal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ ANALYSIS ROUTE ============
@router.post("/analyze")
async def analyze_finances(data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    """Analyze user's financial data with real-time calculations"""
    try:
        user_id = data.get("user_id")
        
        # Get real-time metrics
        metrics = calculate_financial_metrics(user_id)
        
        if not metrics:
            raise HTTPException(status_code=404, detail="User not found")
        
        monthly_income = metrics['monthly_income']
        monthly_expenses = metrics['monthly_expenses']
        monthly_savings = metrics['monthly_savings']
        savings_rate = metrics['savings_rate']
        health_score = metrics['health_score']
        
        return {
            "status": "success",
            "data": {
                "financial_health": {
                    "score": health_score,
                    "monthly_income": monthly_income,
                    "monthly_expenses": monthly_expenses,
                    "monthly_savings": monthly_savings,
                    "savings_rate": savings_rate,
                    "total_expenses": metrics['total_expenses'],
                    "current_month_expenses": metrics['current_month_expenses'],
                    "transaction_count": metrics['transaction_count'],
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
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/goals/analyze")
async def analyze_goals(data: Dict[str, Any], token_data: dict = Depends(verify_token)):
    """Analyze user goals with real-time financial data"""
    try:
        user_id = data.get("user_id")
        
        # Get real-time metrics
        metrics = calculate_financial_metrics(user_id)
        
        if not metrics:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user goals
        goals = list(goals_collection.find({"user_id": user_id, "status": "Active"}))
        
        monthly_income = metrics['monthly_income']
        monthly_expenses = metrics['monthly_expenses']
        monthly_savings = metrics['monthly_savings']
        savings_rate = metrics['savings_rate']
        
        # Calculate goal metrics
        goals_data = []
        total_target = 0
        total_current = 0
        total_monthly_needed = 0
        
        for goal in goals:
            target = goal.get('target_amount', 0)
            current = goal.get('current_amount', 0)
            remaining = target - current
            total_target += target
            total_current += current
            
            # Calculate timeline
            deadline = goal.get('deadline')
            if deadline:
                months_left = max(1, (datetime.strptime(deadline, "%Y-%m-%d") - datetime.now()).days / 30)
            else:
                months_left = 12
            monthly_needed = remaining / months_left
            total_monthly_needed += monthly_needed
            
            goals_data.append({
                "name": goal.get('name'),
                "target": target,
                "current": current,
                "remaining": remaining,
                "monthly_needed": monthly_needed,
                "months_left": int(months_left),
                "priority": goal.get('priority', 'Medium'),
                "is_feasible": monthly_savings >= monthly_needed,
                "progress": (current / target * 100) if target > 0 else 0
            })
        
        overall_progress = (total_current / total_target * 100) if total_target > 0 else 0
        is_feasible = monthly_savings >= total_monthly_needed
        
        # Generate analysis text
        analysis_text = f"""
{'='*50}
FINANCIAL HEALTH REPORT
{'='*50}

YOUR CURRENT FINANCIAL STATUS:
• Monthly Income: ₹{monthly_income:,.2f}
• Monthly Expenses: ₹{monthly_expenses:,.2f}
• Monthly Savings: ₹{monthly_savings:,.2f}
• Savings Rate: {savings_rate:.1f}%
• Financial Health Score: {metrics['health_score']}/100

{'='*50}
GOAL ANALYSIS
{'='*50}

Total Goals: {len(goals)}
Total Target Amount: ₹{total_target:,.2f}
Current Progress: ₹{total_current:,.2f} ({overall_progress:.1f}%)
Monthly Savings Needed: ₹{total_monthly_needed:,.2f}

{'='*50}
RECOMMENDATIONS
{'='*50}

1. {'✅ Your savings are sufficient to achieve all goals!' if is_feasible else f'⚠️ You need to save an additional ₹{total_monthly_needed - monthly_savings:,.0f} per month'}

2. Emergency Fund Target: ₹{monthly_expenses * 6:,.2f}

3. Recommended Monthly SIP: ₹{monthly_savings * 0.7:,.0f}

4. Tax Saving: Invest in PPF/ELSS for Section 80C benefits
"""
        
        return {
            "status": "success",
            "data": {
                "analysis": analysis_text,
                "summary": {
                    "total_goals": len(goals),
                    "total_target": total_target,
                    "total_current": total_current,
                    "overall_progress": overall_progress,
                    "monthly_savings_needed": total_monthly_needed,
                    "current_monthly_savings": monthly_savings,
                    "feasibility": "Achievable" if is_feasible else "Needs Adjustment"
                },
                "goals_analysis": goals_data,
                "metrics": metrics
            }
        }
    except Exception as e:
        print(f"Goal analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))