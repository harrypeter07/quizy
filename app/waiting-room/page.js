"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WaitingRoom() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [started, setStarted] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const pollTimeoutRef = useRef(null);

  // Fetch the most recent quiz info on mount
  useEffect(() => {
    const fetchQuizInfo = async () => {
      try {
        const res = await fetch('/api/quiz/recent');
        if (res.ok) {
          const data = await res.json();
          setQuizInfo(data);
          Cookies.set('quizId', data.quizId, { expires: 30 });
        } else {
          setError('Failed to load quiz info.');
        }
      } catch (err) {
        setError('Failed to load quiz info.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizInfo();
  }, []);

  // Poll for quiz start status
  useEffect(() => {
    if (!quizInfo || !quizInfo.quizId) return;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/quiz/${quizInfo.quizId}/start-status`);
        if (!res.ok) throw new Error('Failed to fetch start status');
        const data = await res.json();
        if (!isMounted) return;
        if (data.active && data.quizIsStarted && data.countdownStartAt) {
          // Calculate countdown
          const now = Date.now();
          const countdownLeft = 5 - Math.floor((now - data.countdownStartAt) / 1000);
          if (countdownLeft > 0) {
            setStarted(true);
            setCountdown(countdownLeft);
            // Start interval to update countdown
            const interval = setInterval(() => {
              const now2 = Date.now();
              const left = 5 - Math.floor((now2 - data.countdownStartAt) / 1000);
              if (left > 0) {
                setCountdown(left);
              } else {
                clearInterval(interval);
                router.replace(`/quiz/${quizInfo.quizId}`);
              }
            }, 250);
            return () => clearInterval(interval);
          } else {
            // Countdown is over, redirect
            router.replace(`/quiz/${quizInfo.quizId}`);
            return;
          }
        } else {
          setStarted(false);
          setCountdown(null);
          pollTimeoutRef.current = setTimeout(pollStatus, 2000);
        }
      } catch (err) {
        setError('Error polling quiz status.');
        pollTimeoutRef.current = setTimeout(pollStatus, 5000);
      }
    };
    pollStatus();
    return () => {
      isMounted = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [quizInfo, router]);

  // Add polling for waiting room count
  useEffect(() => {
    if (!quizInfo || !quizInfo.quizId) return;
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/quiz/${quizInfo.quizId}/user-count`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setWaitingCount(data.waitingUsers ?? 0);
        } else {
          if (isMounted) setWaitingCount(0);
        }
      } catch {
        if (isMounted) setWaitingCount(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [quizInfo]);

  if (loading) {
    return <LoadingSpinner message="Loading waiting room..." />;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Waiting Room</h1>
        <p className="mb-2 text-gray-600">People in waiting room: <span className="font-bold">{waitingCount}</span></p>
        <p className="mb-6 text-gray-600">Quiz: <span className="font-semibold">{quizInfo?.name || quizInfo?.quizId}</span></p>
        {started && countdown !== null ? (
          <div className="mb-4">
            <div className="text-2xl font-semibold text-green-700 mb-2">Quiz Starting Soon!</div>
            <div className="text-5xl font-mono text-green-600 font-bold">{countdown}s</div>
            <p className="text-green-700 mt-2 font-medium">Get ready to answer questions!</p>
          </div>
        ) : (
          <div className="mb-4">
            <div className="text-xl text-blue-700 mb-2">Waiting for the admin to start the quiz...</div>
            <LoadingSpinner message="Checking status..." size="small" inline={true} />
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-semibold"
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 