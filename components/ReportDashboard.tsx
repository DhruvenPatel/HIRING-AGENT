
import React from 'react';
import { EvaluationResult, CandidateProfile, JobProfile } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ReportDashboardProps {
  evaluation: EvaluationResult;
  candidate: CandidateProfile;
  job: JobProfile;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({ evaluation, candidate, job }) => {
  const data = [
    { subject: 'Technical', A: evaluation.scores.technical * 10 },
    { subject: 'Comm.', A: evaluation.scores.communication * 10 },
    { subject: 'Problem Solv.', A: evaluation.scores.problemSolving * 10 },
    { subject: 'Confidence', A: evaluation.scores.confidence * 10 },
  ];

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Hire': return 'text-green-600 bg-green-50 border-green-200';
      case 'Consider': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Reject': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{candidate.name}</h2>
            <p className="text-gray-500 font-medium">Applied for: <span className="text-indigo-600">{job.role}</span></p>
          </div>
          <div className={`px-6 py-2 rounded-full border text-lg font-bold shadow-sm ${getRecommendationColor(evaluation.recommendation)}`}>
            {evaluation.recommendation}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Skill Assessment</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar name="Candidate" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed text-sm">{evaluation.feedback}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(evaluation.scores).map(([key, val]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">{key}</div>
                  <div className="text-2xl font-black text-gray-800">{val}/10</div>
                  <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${val * 10}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
          <h4 className="font-bold mb-2">Technical Verdict</h4>
          <p className="text-sm opacity-90">Based on the responses, the candidate demonstrates {evaluation.scores.technical > 7 ? 'advanced' : 'intermediate'} proficiency in the required tech stack.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h4 className="font-bold mb-2 text-gray-800">Growth Potential</h4>
          <p className="text-sm text-gray-600">Observation of learning agility and problem-solving patterns indicates a {evaluation.scores.problemSolving > 8 ? 'high' : 'standard'} growth ceiling.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h4 className="font-bold mb-2 text-gray-800">Culture Add</h4>
          <p className="text-sm text-gray-600">Communication style is professional. Alignment with team values is suggested via a follow-up panel.</p>
        </div>
      </div>
    </div>
  );
};
