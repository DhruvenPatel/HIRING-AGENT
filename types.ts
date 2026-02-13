
export enum InterviewStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PLANNING = 'PLANNING',
  CONDUCTING = 'CONDUCTING',
  EVALUATING = 'EVALUATING',
  COMPLETED = 'COMPLETED'
}

export interface CandidateProfile {
  name: string;
  skills: string[];
  experience: string;
  summary: string;
}

export interface JobProfile {
  role: string;
  requirements: string[];
  seniority: string;
}

export interface InterviewPlan {
  strategy: string;
  focusAreas: string[];
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  questionCount: number;
}

export interface Message {
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: number;
}

export interface EvaluationResult {
  scores: {
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
  };
  feedback: string;
  recommendation: 'Hire' | 'Consider' | 'Reject';
}

export interface AppState {
  status: InterviewStatus;
  resumeText: string;
  jobDescription: string;
  candidateProfile?: CandidateProfile;
  jobProfile?: JobProfile;
  plan?: InterviewPlan;
  history: Message[];
  evaluation?: EvaluationResult;
}
