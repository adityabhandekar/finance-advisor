from crewai import Crew, Process, Agent, Task
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class GeminiLLM:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')
    
    def generate(self, prompt):
        response = self.model.generate_content(prompt)
        return response.text

class FinancialChatbot:
    def __init__(self):
        self.llm = GeminiLLM()
    
    def analyze_user_finances(self, user_data, expenses, goals):
        """Analyze user's complete financial picture"""
        
        # Calculate key metrics
        monthly_income = user_data.get('monthlyIncome', 0)
        total_expenses = sum(e.get('amount', 0) for e in expenses)
        monthly_expenses = total_expenses / 12 if len(expenses) > 0 else user_data.get('monthlyExpenses', 0)
        monthly_savings = monthly_income - monthly_expenses
        savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
        
        # Analyze expense categories
        expense_categories = {}
        for exp in expenses:
            cat = exp.get('category', 'Other')
            expense_categories[cat] = expense_categories.get(cat, 0) + exp.get('amount', 0)
        
        # Identify unnecessary expenses
        unnecessary_expenses = []
        for cat, amount in expense_categories.items():
            if cat in ['Shopping', 'Entertainment', 'Food'] and amount > 5000:
                unnecessary_expenses.append({
                    "category": cat,
                    "amount": amount,
                    "suggestion": f"Reduce {cat} spending by 30% to save ₹{amount * 0.3:,.2f}"
                })
        
        # Create chatbot agent
        chatbot_agent = Agent(
            role="Senior Financial Advisor & CA - Indian Market Expert",
            goal="Provide personalized financial advice like a Chartered Accountant",
            backstory="""You are an experienced Chartered Accountant (CA) with 15+ years in Indian personal finance.
            You specialize in:
            - Analyzing spending patterns and identifying wasteful expenses
            - Tax planning under Indian Income Tax Act
            - Investment strategies (Mutual Funds, PPF, NPS, Gold)
            - Debt management and loan restructuring
            - Retirement and children's education planning
            
            You speak in a friendly, professional manner. Always use Indian Rupees (₹).
            Provide actionable advice that users can implement immediately.
            Be empathetic but honest about financial habits.""",
            llm=self.llm,
            verbose=True
        )
        
        # Create analysis task
        analysis_task = Task(
            description=f"""
            As a CA, analyze this Indian user's financial situation and provide professional advice:
            
            USER PROFILE:
            - Age: {user_data.get('age', 30)}
            - Occupation: {user_data.get('job_type', 'Salaried')}
            - Marital Status: {user_data.get('marital_status', 'Single')}
            - Children: {user_data.get('children', 0)}
            
            FINANCIAL METRICS:
            - Monthly Income: ₹{monthly_income:,.2f}
            - Monthly Expenses: ₹{monthly_expenses:,.2f}
            - Monthly Savings: ₹{monthly_savings:,.2f}
            - Savings Rate: {savings_rate:.1f}%
            
            EXPENSE BREAKDOWN:
            {expense_categories}
            
            IDENTIFIED UNNECESSARY EXPENSES:
            {unnecessary_expenses}
            
            ACTIVE GOALS:
            {len(goals)} goals totaling ₹{sum(g.get('target_amount', 0) for g in goals):,.2f}
            
            Please provide:
            1. **Expense Analysis**: Which expenses are necessary vs unnecessary
            2. **Savings Opportunities**: Specific amounts you can save by cutting expenses
            3. **Tax Saving Tips**: Under Section 80C, 80D, etc.
            4. **Investment Recommendations**: Where to invest saved money
            5. **Action Plan**: Step-by-step plan for next 3 months
            6. **Emergency Fund Status**: Calculate if adequate
            7. **Debt Management**: If any debt exists
            
            Be specific with numbers in ₹. Be friendly but professional like a CA.
            """,
            expected_output="Detailed financial advice with specific action items in ₹",
            agent=chatbot_agent
        )
        
        crew = Crew(
            agents=[chatbot_agent],
            tasks=[analysis_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        return {
            "analysis": str(result),
            "metrics": {
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "monthly_savings": monthly_savings,
                "savings_rate": round(savings_rate, 1),
                "unnecessary_expenses": unnecessary_expenses
            }
        }
    
    def chat_response(self, user_message, user_data, expenses, goals, conversation_history):
        """Generate chatbot response based on user query"""
        
        # Calculate current metrics
        monthly_income = user_data.get('monthlyIncome', 0)
        total_expenses = sum(e.get('amount', 0) for e in expenses)
        monthly_expenses = total_expenses / 12 if len(expenses) > 0 else user_data.get('monthlyExpenses', 0)
        monthly_savings = monthly_income - monthly_expenses
        
        # Create chat agent
        chat_agent = Agent(
            role="Friendly Financial Advisor & CA",
            goal="Answer user's financial questions like a personal CA",
            backstory="""You are a helpful CA who answers financial questions in simple Hindi/English.
            You give practical advice about:
            - Saving money on daily expenses
            - Tax planning and saving
            - Investment options in India
            - Goal planning and tracking
            - Debt management
            Always be encouraging and positive. Use ₹ for currency.""",
            llm=self.llm,
            verbose=True
        )
        
        # Create chat task
        chat_task = Task(
            description=f"""
            User's Financial Context:
            - Monthly Income: ₹{monthly_income:,.2f}
            - Monthly Expenses: ₹{monthly_expenses:,.2f}
            - Monthly Savings: ₹{monthly_savings:,.2f}
            - Active Goals: {len(goals)}
            
            Previous Conversation:
            {conversation_history}
            
            User Question: {user_message}
            
            Provide a helpful, friendly response as a CA would.
            Give specific advice with numbers in ₹.
            """,
            expected_output="Friendly, helpful financial advice in Hinglish (Hindi + English)",
            agent=chat_agent
        )
        
        crew = Crew(
            agents=[chat_agent],
            tasks=[chat_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        return str(result)