
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from graph import InterviewGraph
from state import InterviewState

app = FastAPI(title="HireGuard AI - Multi-Agent Backend")

# Initialize the LangGraph-based Interview Engine
interview_engine = InterviewGraph()

class SessionRequest(BaseModel):
    resume_text: str
    jd_text: str

class MessageRequest(BaseModel):
    session_id: str
    text: str

@app.post("/session/initialize")
async def initialize_session(req: SessionRequest):
    """
    Triggers the LangGraph agents to analyze resume and JD, 
    and plan the interview strategy.
    """
    try:
        state = await interview_engine.initialize(req.resume_text, req.jd_text)
        return {"session_id": state["session_id"], "status": "initialized", "plan": state["plan"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/session/message")
async def process_message(req: MessageRequest):
    """
    Sends user input to the Conversation Management Agent 
    within the LangGraph workflow.
    """
    response = await interview_engine.process_input(req.session_id, req.text)
    return response

@app.get("/session/{session_id}/report")
async def get_report(session_id: str):
    """
    Invokes the Report Generation Agent to synthesize final scores.
    """
    report = await interview_engine.generate_report(session_id)
    return report

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
