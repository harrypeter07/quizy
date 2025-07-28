"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function WaitingRoom() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const quizId = Cookies.get('quizId') || 'default'; // fallback quizId

  useEffect(() => {
    let interval;
    async function pollStatus() {
      setLoading(true);
      const res = await fetch(`/api/quiz/${quizId}/start-status`);
      const data = await res.json();
      setLoading(false);
      if (data.active) {
        setStarted(true);
        setCountdown(Math.max(0, Math.floor((data.startedAt + (data.countdown || 0) * 1000 - Date.now()) / 1000)));
        interval = setInterval(() => {
          const timeLeft = Math.max(0, Math.floor((data.startedAt + (data.countdown || 0) * 1000 - Date.now()) / 1000));
          setCountdown(timeLeft);
          if (timeLeft <= 0) {
            clearInterval(interval);
            router.replace(`/quiz/${quizId}`);
          }
        }, 1000);
      } else {
        setCountdown(null);
        setStarted(false);
        setTimeout(pollStatus, 2000);
      }
    }
    pollStatus();
    return () => interval && clearInterval(interval);
  }, [quizId, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading waiting room...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
      {!started && <p className="mb-2">Waiting for the quiz to start...</p>}
      {started && countdown !== null && (
        <div className="mb-2 text-lg font-semibold">Quiz starts in <span className="font-mono">{countdown}s</span></div>
      )}
      <div className="mt-4 text-gray-500 text-sm">Please wait. The quiz will begin soon.</div>
    </div>
  );
} 