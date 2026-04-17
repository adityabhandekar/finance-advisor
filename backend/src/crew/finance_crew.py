from crewai import Crew, Process
from ..agents.finance_analyzer import FinanceAnalyzerAgent
from ..agents.goal_analyzer import GoalAnalyzerAgent
from ..agents.investment_planner import InvestmentPlannerAgent
from .tasks import FinanceTasks

class FinanceAdvisorCrew:
    def __init__(self):
        # Create agents
        self.finance_analyzer = FinanceAnalyzerAgent().create_agent()
        self.goal_analyzer = GoalAnalyzerAgent().create_agent()
        self.investment_planner = InvestmentPlannerAgent().create_agent()
        self.tasks = FinanceTasks()
    
    def analyze_complete_financial_picture(self, user_data, goals_data, investment_profile):
        """Run all three agents sequentially"""
        
        # Create tasks
        health_task = self.tasks.analyze_financial_health(
            self.finance_analyzer, user_data
        )
        
        goal_task = self.tasks.analyze_goals(
            self.goal_analyzer, goals_data, user_data
        )
        
        investment_task = self.tasks.create_investment_plan(
            self.investment_planner, investment_profile
        )
        
        # Create crew with sequential processing
        crew = Crew(
            agents=[self.finance_analyzer, self.goal_analyzer, self.investment_planner],
            tasks=[health_task, goal_task, investment_task],
            process=Process.sequential,
            verbose=True
        )
        
        # Kickoff the crew
        result = crew.kickoff()
        return result