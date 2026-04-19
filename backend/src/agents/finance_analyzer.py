from crewai import Agent
import google.generativeai as genai
import os

class GeminiLLM:
    def __init__(self, api_key, model="gemini-1.5-pro"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
    
    def generate_response(self, prompt):
        response = self.model.generate_content(prompt)
        return response.text
    
    def __call__(self, prompt):
        return self.generate_response(prompt)

class FinanceAnalyzerAgent:
    def __init__(self, api_key):
        self.llm = GeminiLLM(api_key) if api_key else None
        
    def create_agent(self):
        return Agent(
            role="Senior Financial Analyst - Indian Market Expert",
            goal="Analyze user's complete financial profile and provide personalized insights",
            backstory="""You are an expert financial analyst with 20+ years experience in Indian personal finance.
            You analyze: Income, Expenses, Savings Rate, Debt, Emergency Fund, Investments.
            You understand Indian financial products: PPF, EPF, NPS, Mutual Funds, Fixed Deposits, Gold Bonds.
            Always use Indian Rupees (₹). Provide actionable advice based on user's life stage.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )