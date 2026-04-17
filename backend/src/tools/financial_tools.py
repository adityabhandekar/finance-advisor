from crewai.tools import tool
from typing import Optional

@tool("Financial Calculator")
def financial_calculator(monthly_income: float, monthly_expenses: float, 
                         savings_goal: float = 0, time_horizon_months: int = 12) -> str:
    """Calculates financial metrics in Indian Rupees (₹)"""
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = (monthly_savings / monthly_income) * 100 if monthly_income > 0 else 0
    
    result = f"""
    📊 Financial Analysis Results (in ₹):
    - Monthly Income: ₹{monthly_income:,.2f}
    - Monthly Expenses: ₹{monthly_expenses:,.2f}
    - Monthly Savings: ₹{monthly_savings:,.2f}
    - Savings Rate: {savings_rate:.1f}%
    """
    
    if savings_goal > 0 and monthly_savings > 0:
        months_needed = savings_goal / monthly_savings
        result += f"""
    - Savings Goal: ₹{savings_goal:,.2f}
    - Time to reach goal: {months_needed:.1f} months ({months_needed/12:.1f} years)
    - Monthly investment needed: ₹{(savings_goal / time_horizon_months):,.2f}
    """
    
    return result

@tool("Market Data")
def market_data(symbol: str = "NIFTY50") -> str:
    """Fetches market data for Indian markets"""
    market_data_dict = {
        "NIFTY50": "22,500",
        "SENSEX": "74,000",
        "BANKNIFTY": "48,000"
    }
    price = market_data_dict.get(symbol.upper(), "N/A")
    return f"📈 {symbol} is currently trading at ₹{price}"