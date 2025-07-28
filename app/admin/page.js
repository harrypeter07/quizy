"use client";
import { useState } from 'react';

export default function AdminPage() {
  const [quizId, setQuizId] = useState('default');
  const [status, setStatus] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const handleStartQuiz = async () => {
    setStatus('Starting quiz...');
    const res = await fetch(`/api/quiz/${quizId}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setStatus('Quiz started!');
    } else {
      setStatus('Failed to start quiz.');
    }
  };

  const handleEvaluate = async () => {
    setStatus('Evaluating...');
    const res = await fetch(`/api/admin/quiz/${quizId}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setStatus('Evaluation complete!');
    } else {
      setStatus('Failed to evaluate.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="mb-4 flex flex-col gap-2 w-full max-w-xs">
        <input
          type="text"
          className="border rounded px-3 py-2"
          placeholder="Quiz ID"
          value={quizId}
          onChange={e => setQuizId(e.target.value)}
        />
        <input
          type="password"
          className="border rounded px-3 py-2"
          placeholder="Admin Token"
          value={adminToken}
          onChange={e => setAdminToken(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white rounded px-3 py-2 mt-2"
          onClick={handleStartQuiz}
        >
          Start Quiz
        </button>
        <button
          className="bg-green-600 text-white rounded px-3 py-2 mt-2"
          onClick={handleEvaluate}
        >
          Evaluate Quiz
        </button>
      </div>
      {status && <div className="mt-4 text-lg font-semibold">{status}</div>}
    </div>
  );
} 