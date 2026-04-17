from pymongo import MongoClient

try:
    client = MongoClient('mongodb://localhost:27017')
    db = client['financeadvisor']
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB is running and connected!")
    print(f"📊 Database: {db.name}")
    print(f"📁 Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Please make sure MongoDB is installed and running")