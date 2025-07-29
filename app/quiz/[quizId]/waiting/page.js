"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function QuizWaitingPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [answerCount, setAnswerCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get answer count from localStorage (if stored by quiz page)
    const answers = JSON.parse(localStorage.getItem(`answers_${quizId}`) || '[]');
    setAnswerCount(answers.length);
    setLoading(false);
  }, [quizId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-blue-800">Quiz Submitted!</h1>
        {loading ? (
          <LoadingSpinner message="Loading summary..." />
        ) : (
          <>
            <div className="mb-4 text-lg text-gray-700">You answered <span className="font-bold text-blue-700">{answerCount}</span> questions.</div>
            <div className="mb-6 text-gray-600">Please wait while the results are being prepared.<br/>You will be redirected to the results page when they are ready.</div>
          </>
        )}
      </div>
    </div>
  );
} 