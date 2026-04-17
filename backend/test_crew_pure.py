from src.crew.finance_crew import FinanceAdvisorCrew

def test_pure_crew():
    print("🚀 Testing Pure CrewAI (No LangChain)...")
    
    crew = FinanceAdvisorCrew()
    
    user_data = {
        "monthly_income": 50000,
        "monthly_expenses": 35000,
        "savings_rate": 30,
        "debt": 500000,
        "emergency_fund": 100000,
        "age": 30
    }
    
    goals_data = {
        "goals": [
            {"name": "Emergency Fund", "target": 200000, "priority": "High"},
            {"name": "Retirement Corpus", "target": 5000000, "priority": "High"},
            {"name": "Buy a House", "target": 1000000, "priority": "Medium"}
        ]
    }
    
    investment_profile = {
        "risk_tolerance": "Moderate",
        "time_horizon": "15 years",
        "monthly_investment": 15000,
        "age": 30
    }
    
    print("\n📊 Running Financial Analysis...")
    result = crew.analyze_complete_financial_picture(user_data, goals_data, investment_profile)
    
    print("\n✅ Analysis Complete!")
    print("\n" + "="*50)
    print(result)
    print("="*50)

if __name__ == "__main__":
    test_pure_crew()