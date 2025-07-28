"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WaitingRoom() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const quizId = Cookies.get('quizId') || 'default';
  const pollTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let interval;
    let isMounted = true;
    
    async function pollStatus() {
      if (polling || !isMounted) return; // Prevent multiple simultaneous requests
      
      setPolling(true);
      try {
        const res = await fetch(`/api/quiz/${quizId}/start-status`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!isMounted) return; // Check if component is still mounted
        
        if (data.active) {
          setStarted(true);
          setLoading(false);
          const countdownTime = Math.max(0, Math.floor((data.startedAt + (data.countdown || 0) * 1000 - Date.now()) / 1000));
          setCountdown(countdownTime);
          
          interval = setInterval(() => {
            if (!isMounted) return;
            const timeLeft = Math.max(0, Math.floor((data.startedAt + (data.countdown || 0) * 1000 - Date.now()) / 1000));
            setCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(interval);
              router.replace(`/(quiz)/${quizId}`);
            }
          }, 1000);
        } else {
          setCountdown(null);
          setStarted(false);
          setLoading(false);
          // Poll again after 3 seconds
          if (isMounted) {
            pollTimeoutRef.current = setTimeout(pollStatus, 3000);
          }
        }
      } catch (error) {
        console.error('Error polling quiz status:', error);
        retryCountRef.current += 1;
        
        if (isMounted) {
          setLoading(false);
          setError(`Connection error (attempt ${retryCountRef.current})`);
          
          // Stop retrying after 5 attempts
          if (retryCountRef.current < 5) {
            pollTimeoutRef.current = setTimeout(pollStatus, 5000);
          } else {
            setError('Unable to connect to server. Please refresh the page.');
          }
        }
      } finally {
        if (isMounted) {
          setPolling(false);
        }
      }
    }
    
    pollStatus();
    
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [quizId, router]); // Removed 'polling' from dependencies

  if (loading) {
    return <LoadingSpinner message="Loading waiting room..." />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 max-w-md text-center">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      )}
      
      {!started && !error && (
        <div className="text-center">
          <p className="mb-2">Waiting for the quiz to start...</p>
          {polling && <LoadingSpinner message="Checking quiz status..." size="small" inline={true} />}
          {!polling && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Status
            </button>
          )}
        </div>
      )}
      
      {started && countdown !== null && (
        <div className="mb-2 text-lg font-semibold">Quiz starts in <span className="font-mono">{countdown}s</span></div>
      )}
      
      {!error && (
        <div className="mt-4 text-gray-500 text-sm">Please wait. The quiz will begin soon.</div>
      )}
    </div>
  );
} 