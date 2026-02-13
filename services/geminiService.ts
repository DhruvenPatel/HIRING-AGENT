
import { GoogleGenAI, Type } from "@google/genai";
import { CandidateProfile, JobProfile, EvaluationResult, Message } from "../types";

const FAST_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

/**
 * AGENT: Fast Pulse Scan
 * Combines Resume and JD analysis into one fast pass to speed up initialization.
 */
export async function fastScan(resume: string, jd: string): Promise<{ candidate: CandidateProfile; job: JobProfile }> {
  // Always create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: `Analyze both the resume and job description. Provide structured summaries for both.
    
    RESUME:
    ${resume}
    
    JD:
    ${jd}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          candidate: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experience: { type: Type.STRING },
              summary: { type: Type.STRING }
            },
            required: ["name", "skills", "experience", "summary"]
          },
          job: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              seniority: { type: Type.STRING }
            },
            required: ["role", "requirements", "seniority"]
          }
        },
        required: ["candidate", "job"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

/**
 * AGENT: Evaluation & Reporting (Post-Interview)
 */
export async function generateFinalReport(
  history: Message[],
  candidate: CandidateProfile,
  job: JobProfile
): Promise<EvaluationResult> {
  // Always create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const conversation = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Evaluate this transcript for ${job.role}.\n\nCandidate: ${candidate.name}\n\nTranscript:\n${conversation}`,
    config: {
      thinkingConfig: { thinkingBudget: 10000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              technical: { type: Type.NUMBER },
              communication: { type: Type.NUMBER },
              problemSolving: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER }
            }
          },
          feedback: { type: Type.STRING },
          recommendation: { type: Type.STRING, enum: ["Hire", "Consider", "Reject"] }
        },
        required: ["scores", "feedback", "recommendation"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
}
