
import os
import google.generativeai as genai
from state import InterviewState
import json

# Initialize Gemini with the API Key
genai.configure(api_key=os.environ.get("API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash') # High-performance model for agentic nodes

class ResumeAgent:
    def process(self, state: InterviewState):
        prompt = f"""
        Extract professional profile from the following resume text.
        Return ONLY valid JSON.
        Format: {{"name": "...", "skills": ["...", "..."], "experience": "...", "summary": "..."}}
        
        TEXT:
        {state['resume_text']}
        """
        response = model.generate_content(prompt)
        try:
            state["candidate_profile"] = json.loads(response.text.strip('`json\n '))
        except:
            state["candidate_profile"] = {"name": "Unknown", "skills": [], "experience": "", "summary": ""}
        return state

class JDAgent:
    def process(self, state: InterviewState):
        prompt = f"""
        Extract core requirements from this Job Description.
        Return ONLY valid JSON.
        Format: {{"role": "...", "requirements": ["...", "..."], "seniority": "..."}}
        
        TEXT:
        {state['jd_text']}
        """
        response = model.generate_content(prompt)
        try:
            state["job_requirements"] = json.loads(response.text.strip('`json\n '))
        except:
            state["job_requirements"] = {"role": "Generalist", "requirements": [], "seniority": "Mid"}
        return state

class PlanningAgent:
    def process(self, state: InterviewState):
        profile = state.get("candidate_profile", {})
        reqs = state.get("job_requirements", {})
        
        prompt = f"""
        Compare the candidate profile with the job requirements.
        Identify 3 key technical skill gaps and create a strategic interview plan.
        Return ONLY JSON.
        Format: {{"strategy": "...", "focus_areas": ["...", "..."], "difficulty": "..."}}
        
        CANDIDATE: {json.dumps(profile)}
        JOB: {json.dumps(reqs)}
        """
        response = model.generate_content(prompt)
        try:
            state["plan"] = json.loads(response.text.strip('`json\n '))
        except:
            state["plan"] = {"strategy": "Standard evaluation", "focus_areas": [], "difficulty": "Standard"}
        return state

class QuestionGenAgent:
    def process(self, state: InterviewState):
        history = state.get("history", [])
        plan = state.get("plan", {})
        
        prompt = f"""
        You are the Question Generation Agent. Based on the interview plan and history, 
        generate the NEXT specific technical interview question.
        PLAN: {json.dumps(plan)}
        HISTORY: {json.dumps(history)}
        
        Return ONLY the question text.
        """
        response = model.generate_content(prompt)
        state["next_question"] = response.text.strip()
        return state

class EvaluationAgent:
    def process(self, state: InterviewState):
        history = state.get("history", [])
        if not history: return state
        
        prompt = f"""
        Analyze the latest candidate response in the history.
        Update the current aggregate score (0-100).
        HISTORY: {json.dumps(history)}
        
        Return ONLY a number.
        """
        response = model.generate_content(prompt)
        try:
            state["current_score"] = float(response.text.strip())
        except:
            pass
        return state
