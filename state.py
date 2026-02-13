
from typing import TypedDict, List, Optional, Dict, Any

class InterviewState(TypedDict):
    session_id: Optional[str]
    resume_text: str
    jd_text: str
    candidate_profile: Optional[Dict[str, Any]]
    job_requirements: Optional[Dict[str, Any]]
    plan: Optional[Dict[str, Any]]
    history: List[Dict[str, str]]
    next_question: Optional[str]
    current_score: float
    evaluation: Optional[Dict[str, Any]]
