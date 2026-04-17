from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GoalModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[datetime] = None
    priority: str = "Medium"  # High, Medium, Low
    status: str = "Active"  # Active, Completed, Cancelled
    created_at: datetime = datetime.now()