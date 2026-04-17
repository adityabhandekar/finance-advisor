import requests
import json

# Register a test user
user_data = {
    "email": "demo@financeadvisor.com",
    "name": "Demo User",
    "password": "demo123",
    "profile": {
        "age": 30,
        "annualIncome": 600000
    }
}

response = requests.post(
    "http://localhost:8000/api/auth/register",
    json=user_data
)

print("Status:", response.status_code)
print("Response:", response.json())