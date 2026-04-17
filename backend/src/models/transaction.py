from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    amount: float
    type: str  # income, expense
    category: str
    description: Optional[str] = None
    date: datetime = datetime.now()
    is_recurring: bool = False