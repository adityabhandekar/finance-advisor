from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

class DatabaseService:
    def __init__(self):
        self.client = None
        self.db = None
        self.users = None
        self.goals = None
        self.transactions = None
        
    async def connect(self):
        """Connect to MongoDB"""
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        database_name = os.getenv("DATABASE_NAME", "financeadvisor")
        
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.client[database_name]
        self.users = self.db.users
        self.goals = self.db.goals
        self.transactions = self.db.transactions
        
        # Create indexes
        await self.users.create_index("email", unique=True)
        await self.users.create_index("id")
        await self.goals.create_index("user_id")
        await self.transactions.create_index("user_id")
        
        print(f"✅ Connected to MongoDB database: {database_name}")
        return self
    
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
    
    # User operations
    async def create_user(self, user_data: dict):
        """Create a new user"""
        # Hash password
        hashed = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
        user_data['password'] = hashed.decode('utf-8')
        user_data['created_at'] = datetime.now()
        user_data['updated_at'] = datetime.now()
        
        result = await self.users.insert_one(user_data)
        return str(result.inserted_id)
    
    async def get_user_by_email(self, email: str):
        """Get user by email"""
        user = await self.users.find_one({"email": email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    async def get_user_by_id(self, user_id: str):
        """Get user by ID"""
        try:
            user = await self.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except:
            return None
    
    async def verify_password(self, email: str, password: str):
        """Verify user password"""
        user = await self.get_user_by_email(email)
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return user
        return None
    
    # Goal operations
    async def create_goal(self, goal_data: dict):
        """Create a new financial goal"""
        goal_data['created_at'] = datetime.now()
        result = await self.goals.insert_one(goal_data)
        return str(result.inserted_id)
    
    async def get_user_goals(self, user_id: str):
        """Get all goals for a user"""
        goals = []
        async for goal in self.goals.find({"user_id": user_id}):
            goal['_id'] = str(goal['_id'])
            goals.append(goal)
        return goals
    
    async def update_goal(self, goal_id: str, update_data: dict):
        """Update a goal"""
        await self.goals.update_one(
            {"_id": ObjectId(goal_id)},
            {"$set": update_data}
        )
    
    # Transaction operations
    async def create_transaction(self, transaction_data: dict):
        """Create a new transaction"""
        transaction_data['date'] = datetime.now()
        result = await self.transactions.insert_one(transaction_data)
        return str(result.inserted_id)
    
    async def get_user_transactions(self, user_id: str, limit: int = 50):
        """Get user transactions"""
        transactions = []
        async for tx in self.transactions.find({"user_id": user_id}).sort("date", -1).limit(limit):
            tx['_id'] = str(tx['_id'])
            transactions.append(tx)
        return transactions
    
    async def get_financial_summary(self, user_id: str):
        """Get financial summary for user"""
        # Get all transactions
        transactions = []
        async for tx in self.transactions.find({"user_id": user_id}):
            transactions.append(tx)
        
        total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
        total_expenses = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
        
        # Get goals
        goals = await self.get_user_goals(user_id)
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "savings": total_income - total_expenses,
            "goals_count": len(goals),
            "active_goals": len([g for g in goals if g.get('status') == 'Active'])
        }

# Create a global instance
db = DatabaseService()