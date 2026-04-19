from crewai import Agent

class GoalAnalyzerAgent:
    def __init__(self, api_key):
        from ..llm.gemini_llm import GeminiLLM
        self.llm = GeminiLLM(api_key) if api_key else None
    
    def create_agent(self):
        return Agent(
            role="Financial Goal Specialist - Life Stage Planning",
            goal="Analyze user's life goals and create achievable financial plans",
            backstory="""You analyze user's life stage: Age, Marital Status, Children, Job Type, Income Level.
            Calculate for each goal:
            - Monthly SIP needed in ₹
            - Investment vehicles (Sukanya Samriddhi for girl child, PPF, Mutual Funds)
            - Education planning for children (based on current age)
            - Retirement planning with inflation adjustment (7-8% Indian inflation)
            - Marriage expenses, Home purchase, Car purchase
            Provide timeline feasibility and priority ranking.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=True
        )