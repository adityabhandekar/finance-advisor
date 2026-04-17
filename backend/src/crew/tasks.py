from crewai import Task

class FinanceTasks:
    
    @staticmethod
    def analyze_financial_health(agent, user_data):
        return Task(
            description=f"""
            Analyze the following user's financial data (in Indian Rupees ₹):
            
            FINANCIAL DATA:
            - Monthly Income: ₹{user_data.get('monthly_income', 0):,.2f}
            - Monthly Expenses: ₹{user_data.get('monthly_expenses', 0):,.2f}
            - Savings Rate: {user_data.get('savings_rate', 0)}%
            - Existing Debt: ₹{user_data.get('debt', 0):,.2f}
            - Emergency Fund: ₹{user_data.get('emergency_fund', 0):,.2f}
            - Age: {user_data.get('age', 30)}
            
            Provide a detailed Indian personal finance analysis including:
            1. Financial Health Score (0-100)
            2. Monthly surplus/shortfall analysis in ₹
            3. Emergency fund adequacy (should be 6 months of expenses = ₹{user_data.get('monthly_expenses', 0) * 6:,.2f})
            4. Debt-to-income ratio assessment
            5. 5 specific recommendations for Indian context (PPF, Mutual Funds SIP, etc.)
            """,
            expected_output="Detailed financial health report with Indian context and ₹ currency",
            agent=agent
        )
    
    @staticmethod
    def analyze_goals(agent, goals_data, financial_context):
        return Task(
            description=f"""
            Analyze user's financial goals for Indian market:
            
            FINANCIAL CONTEXT:
            - Monthly Income: ₹{financial_context.get('monthly_income', 0):,.2f}
            - Monthly Expenses: ₹{financial_context.get('monthly_expenses', 0):,.2f}
            - Available for Savings: ₹{financial_context.get('monthly_income', 0) - financial_context.get('monthly_expenses', 0):,.2f}
            
            USER'S GOALS:
            {goals_data.get('goals', [])}
            
            For each goal, provide:
            1. Monthly SIP/Investment needed in ₹
            2. Recommended Indian investment products (PPF, Mutual Funds, etc.)
            3. Time feasibility (months/years)
            4. Priority ranking (High/Medium/Low)
            
            Consider Indian inflation rate (typically 5-6% for long-term goals).
            """,
            expected_output="Goal analysis with monthly investment requirements in ₹",
            agent=agent
        )
    
    @staticmethod
    def create_investment_plan(agent, profile_data):
        return Task(
            description=f"""
            Create an investment plan for Indian investor:
            
            PROFILE:
            - Risk Tolerance: {profile_data.get('risk_tolerance', 'Moderate')}
            - Investment Horizon: {profile_data.get('time_horizon', '10+ years')}
            - Monthly Investment Capacity: ₹{profile_data.get('monthly_investment', 0):,.2f}
            - Age: {profile_data.get('age', 30)}
            
            Provide a comprehensive investment plan:
            1. Asset allocation (Indian context):
               - Large Cap Mutual Funds (e.g., SBI Bluechip, HDFC Top 100)
               - Mid/Small Cap Funds
               - Debt (PPF/EPF/FD)
               - Gold (SGB/Gold ETFs)
            2. Monthly SIP amounts in ₹ for each category
            3. Expected returns (equity: 12-15%, debt: 7-8%)
            4. Tax benefits under Section 80C, 80D
            5. Rebalancing strategy (annual review)
            """,
            expected_output="Comprehensive investment plan for Indian investor in ₹",
            agent=agent
        )