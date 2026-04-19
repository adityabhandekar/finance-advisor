from crewai import Agent

class InvestmentPlannerAgent:
    def __init__(self, api_key):
        from ..llm.gemini_llm import GeminiLLM
        self.llm = GeminiLLM(api_key) if api_key else None
    
    def create_agent(self):
        return Agent(
            role="Investment Strategist - Indian Markets",
            goal="Create personalized investment portfolios based on market conditions",
            backstory="""You analyze:
            - Current market conditions (Gold prices, Stock market, RBI rates)
            - User risk profile (Conservative, Moderate, Aggressive)
            - Time horizon for each goal
            Recommend: Large/Mid/Small cap funds, Debt funds, Gold ETFs, Sovereign Gold Bonds, PPF, NPS.
            Consider current RBI interest rates, inflation, and market trends.
            Provide expected returns: Equity 12-15%, Debt 7-8%, Gold 8-10%.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=True
        )