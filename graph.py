
from typing import TypedDict, List, Dict
from langgraph.graph import StateGraph, END
from agents import (
    ResumeAgent, 
    JDAgent, 
    PlanningAgent, 
    QuestionGenAgent, 
    EvaluationAgent
)
from state import InterviewState
import uuid

class InterviewGraph:
    def __init__(self):
        # 1. Initialize State Graph
        workflow = StateGraph(InterviewState)

        # 2. Instantiate Agent Nodes
        self.resume_agent = ResumeAgent()
        self.jd_agent = JDAgent()
        self.planner = PlanningAgent()
        self.q_gen = QuestionGenAgent()
        self.evaluator = EvaluationAgent()

        # 3. Build Nodes
        workflow.add_node("analyze_resume", self.resume_agent.process)
        workflow.add_node("analyze_jd", self.jd_agent.process)
        workflow.add_node("plan_interview", self.planner.process)
        workflow.add_node("generate_question", self.q_gen.process)
        workflow.add_node("evaluate_turn", self.evaluator.process)

        # 4. Connect Graph
        workflow.set_entry_point("analyze_resume")
        workflow.add_edge("analyze_resume", "analyze_jd")
        workflow.add_edge("analyze_jd", "plan_interview")
        workflow.add_edge("plan_interview", "generate_question")
        
        # In a real dynamic session, evaluate_turn would check if we should loop or end
        workflow.add_edge("generate_question", "evaluate_turn")
        workflow.add_edge("evaluate_turn", END)

        # 5. Compile
        self.app = workflow.compile()

    async def initialize(self, resume: str, jd: str):
        # Initial invocation of the graph to prepare the session
        initial_state: InterviewState = {
            "session_id": str(uuid.uuid4()),
            "resume_text": resume,
            "jd_text": jd,
            "history": [],
            "plan": {},
            "current_score": 0.0,
            "candidate_profile": None,
            "job_requirements": None,
            "next_question": None,
            "evaluation": None
        }
        # Run the initialization path
        final_state = await self.app.ainvoke(initial_state)
        return final_state
