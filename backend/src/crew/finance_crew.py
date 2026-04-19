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

class FinanceAdvisorCrew:
    def __init__(self):
        self.llm = GeminiLLM()
        
    def analyze_financial_health(self, user_data, expenses, goals):
        """Analyze financial health using Gemini AI"""
        
        # Calculate real metrics from data
        monthly_income = user_data.get('monthlyIncome', 0)
        total_expenses = sum(e.get('amount', 0) for e in expenses)
        monthly_expenses = total_expenses / 12 if len(expenses) > 0 else user_data.get('monthlyExpenses', 0)
        monthly_savings = monthly_income - monthly_expenses
        savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0
        
        # Prepare expense breakdown
        expense_categories = {}
        for exp in expenses:
            cat = exp.get('category', 'Other')
            expense_categories[cat] = expense_categories.get(cat, 0) + exp.get('amount', 0)
        
        # Create analysis agent
        financial_agent = Agent(
            role="Senior Financial Analyst - Indian Market Expert",
            goal="Provide accurate financial health analysis based on real expense data",
            backstory="""You are an expert financial analyst with 20+ years experience in Indian personal finance.
            You analyze real expense data to provide accurate insights. Always use Indian Rupees (₹).
            Provide practical, actionable advice based on actual spending patterns.""",
            llm=self.llm,
            verbose=True
        )
        
        # Create analysis task with real data
        analysis_task = Task(
            description=f"""
            Analyze this Indian user's REAL financial data:
            
            PERSONAL DETAILS:
            - Age: {user_data.get('age', 30)}
            - Job Type: {user_data.get('job_type', 'Salaried')}
            - Marital Status: {user_data.get('marital_status', 'Single')}
            - Children: {user_data.get('children', 0)}
            
            REAL FINANCIAL DATA:
            - Monthly Income: ₹{monthly_income:,.2f}
            - Total Expenses (All Time): ₹{total_expenses:,.2f}
            - Calculated Monthly Expenses: ₹{monthly_expenses:,.2f}
            - Monthly Savings: ₹{monthly_savings:,.2f}
            - Savings Rate: {savings_rate:.1f}%
            
            REAL EXPENSE BREAKDOWN:
            {expense_categories}
            
            ACTIVE GOALS:
            {len(goals)} goals with total target: ₹{sum(g.get('target_amount', 0) for g in goals):,.2f}
            
            Based on this REAL data, provide:
            1. Financial Health Score (0-100) based on actual savings rate
            2. Analysis of spending patterns from expense data
            3. 5 specific, actionable recommendations for improvement
            4. Emergency fund calculation (6 months expenses = ₹{monthly_expenses * 6:,.2f})
            5. Monthly SIP recommendation based on actual savings
            """,
            expected_output="Detailed financial analysis with accurate calculations from real expense data",
            agent=financial_agent
        )
        
        crew = Crew(
            agents=[financial_agent],
            tasks=[analysis_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        return {
            "analysis": str(result),
            "calculated_metrics": {
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "monthly_savings": monthly_savings,
                "savings_rate": round(savings_rate, 1),
                "health_score": min(100, max(0, int(savings_rate + 30))),
                "total_expenses": total_expenses,
                "emergency_fund_needed": monthly_expenses * 6,
                "recommended_sip": monthly_savings * 0.7
            }
        }
    
    def analyze_goals(self, user_data, goals, monthly_savings):
        """Analyze user goals and provide intelligent recommendations using Gemini AI"""
        
        # Prepare goals data
        goals_data = []
        for goal in goals:
            progress = (goal.get('current_amount', 0) / goal.get('target_amount', 1)) * 100
            remaining = goal.get('target_amount', 0) - goal.get('current_amount', 0)
            
            # Calculate timeline
            deadline = goal.get('deadline')
            if deadline:
                months_left = max(1, (datetime.strptime(deadline, "%Y-%m-%d") - datetime.now()).days / 30)
            else:
                months_left = 12
            
            monthly_needed = remaining / months_left
            
            goals_data.append({
                "name": goal.get('name'),
                "target": goal.get('target_amount'),
                "current": goal.get('current_amount'),
                "progress": progress,
                "remaining": remaining,
                "deadline": deadline,
                "months_left": int(months_left),
                "monthly_needed": monthly_needed,
                "priority": goal.get('priority', 'Medium')
            })
        
        # Create goal analysis agent
        goal_agent = Agent(
            role="Financial Goal Specialist - Indian Market Expert",
            goal="Analyze user's financial goals and provide actionable recommendations",
            backstory="""You are a Certified Financial Planner (CFP) with expertise in Indian personal finance.
            You specialize in goal-based financial planning, retirement planning, children's education,
            home buying, and investment strategies. You provide realistic, achievable recommendations
            based on the user's financial situation. Always use Indian Rupees (₹).""",
            llm=self.llm,
            verbose=True
        )
        
        # Create goal analysis task
        goal_task = Task(
            description=f"""
            Analyze these financial goals for an Indian user:
            
            USER PROFILE:
            - Age: {user_data.get('age', 30)}
            - Job Type: {user_data.get('job_type', 'Salaried')}
            - Marital Status: {user_data.get('marital_status', 'Single')}
            - Children: {user_data.get('children', 0)}
            - Monthly Income: ₹{user_data.get('monthlyIncome', 0):,.2f}
            - Monthly Savings Available: ₹{monthly_savings:,.2f}
            
            USER'S FINANCIAL GOALS:
            {goals_data}
            
            For EACH goal, analyze and provide:
            1. Feasibility assessment (Realistic/Stretch/Unrealistic)
            2. Recommended monthly investment needed
            3. Best investment vehicles for this goal (Indian context - PPF, Mutual Funds, Gold, etc.)
            4. Priority ranking (1 being highest)
            5. Timeline adjustment suggestion if needed
            
            Additionally provide:
            1. Overall goal portfolio assessment
            2. If savings insufficient, suggest which goals to prioritize
            3. Specific action items for the next 3 months
            4. Tax implications under Indian tax laws (Section 80C, 80D, etc.)
            5. Emergency fund status and recommendation
            
            Be practical and specific with numbers in ₹.
            """,
            expected_output="Detailed goal analysis with actionable recommendations in ₹",
            agent=goal_agent
        )
        
        crew = Crew(
            agents=[goal_agent],
            tasks=[goal_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Calculate goal summary
        total_target = sum(g.get('target_amount', 0) for g in goals)
        total_current = sum(g.get('current_amount', 0) for g in goals)
        total_remaining = total_target - total_current
        
        # Calculate priority recommendations
        priority_goals = sorted(goals_data, key=lambda x: x.get('priority', 'Medium') == 'High', reverse=True)
        
        return {
            "analysis": str(result),
            "summary": {
                "total_goals": len(goals),
                "total_target": total_target,
                "total_current": total_current,
                "total_remaining": total_remaining,
                "overall_progress": (total_current / total_target * 100) if total_target > 0 else 0,
                "monthly_savings_needed": sum(g['monthly_needed'] for g in goals_data),
                "feasibility": "Achievable" if monthly_savings >= sum(g['monthly_needed'] for g in goals_data) else "Needs Adjustment"
            },
            "goals_analysis": [
                {
                    "name": g['name'],
                    "monthly_needed": g['monthly_needed'],
                    "priority": g['priority'],
                    "remaining_months": g['months_left'],
                    "is_on_track": monthly_savings >= g['monthly_needed']
                }
                for g in goals_data
            ]
        }