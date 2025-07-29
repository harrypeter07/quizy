"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from '../components/LoadingSpinner';
import Image from 'next/image';

export default function WaitingRoom() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [currentQuizId, setCurrentQuizId] = useState(Cookies.get('quizId') || 'default');
  const pollTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const [timeoutError, setTimeoutError] = useState(false);

  useEffect(() => {
    // Timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setTimeoutError(true);
        setLoading(false);
      }
    }, 10000); // 10 seconds
    return () => clearTimeout(timeout);
  }, [loading]);

  // Periodically refresh the most recent quizId
  useEffect(() => {
    let lastQuizId = currentQuizId;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/quiz/recent');
        if (res.ok) {
          const data = await res.json();
          if (data.quizId && data.quizId !== lastQuizId) {
            setCurrentQuizId(data.quizId);
            setQuizInfo(data);
            Cookies.set('quizId', data.quizId, { expires: 30 });
            lastQuizId = data.quizId;
          }
        }
      } catch (e) {
        // ignore
      }
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, [currentQuizId]);

  useEffect(() => {
    // Fetch quiz and user info
    const fetchInfo = async () => {
      try {
        const res = await fetch('/api/quiz/recent');
        if (res.ok) {
          const data = await res.json();
          setQuizInfo(data);
          setCurrentQuizId(data.quizId);
          Cookies.set('quizId', data.quizId, { expires: 30 });
        }
        // Get user info from cookies
        const displayName = Cookies.get('displayName');
        const uniqueId = Cookies.get('uniqueId');
        if (displayName && uniqueId) {
          setUserInfo({ displayName, uniqueId });
        }
      } catch (error) {
        console.error('Error fetching quiz info:', error);
        setError('Failed to load quiz info. Please check your connection or try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []); // only on mount

  useEffect(() => {
    let isMounted = true;

    async function pollStatus() {
      if (polling || !isMounted) return; // Prevent multiple simultaneous requests

      setPolling(true);
      try {
        const res = await fetch(`/api/quiz/${currentQuizId}/start-status`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (!isMounted) return;
        if (data.active) {
          setStarted(true);
          setLoading(false);
          // Immediately redirect to quiz page
          router.replace(`/quiz/${currentQuizId}`);
          return;
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
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [currentQuizId, router, polling]);

  if (loading) {
    // Only show a generic loading message until quizInfo is available
    return <LoadingSpinner message={"Loading waiting room..."} />;
  }
  if (timeoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load waiting room</h2>
          <p className="mb-4">The request timed out. Please check your internet connection or try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Refresh</button>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/blue-paperboard-bg.jpg"
          alt="Blue Paperboard Background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#14134c]/80 to-[#f8e0a0]/20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/90 rounded-full shadow-2xl mb-4">
                <div className="text-3xl sm:text-4xl">⏳</div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
              Waiting Room
            </h1>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block mb-4">
              <p className="text-white font-semibold text-lg sm:text-xl">
                Student Sports Club RBU
              </p>
            </div>
            
            {/* Quiz Info Display */}
            {quizInfo && (
              <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm rounded-xl px-6 py-4 mb-4 border border-white/30 shadow-lg">
                <h2 className="text-white font-bold text-2xl sm:text-3xl mb-2 drop-shadow-md">
                  {quizInfo.name}
                </h2>
                <div className="flex flex-wrap justify-center gap-4 text-white/90 text-sm sm:text-base mb-2">
                  <span className="flex items-center">
                    <span className="mr-1">📝</span>
                    {quizInfo.questionCount} Questions
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">🔄</span>
                    {quizInfo.totalRounds} Rounds
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">⏱️</span>
                    {quizInfo.questionsPerRound} per Round
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-xs">
                    Created: {quizInfo.formattedCreatedAt}
                  </p>
                </div>
              </div>
            )}
            
            {/* User Welcome */}
            {userInfo && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 mb-4 border border-white/20">
                <p className="text-white/90 text-sm">Welcome,</p>
                <p className="text-white font-bold text-lg">
                  {userInfo.displayName}#{userInfo.uniqueId}
                </p>
              </div>
            )}
            
            <p className="text-white/90 text-lg sm:text-xl font-medium drop-shadow-md">
              Get ready for the Feud!
            </p>
          </div>
          
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p className="font-medium">Connection Error</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            )}
            
            {!started && !error && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-[#f8e0a0]/20 to-[#14134c]/10 border border-[#14134c]/20 rounded-xl p-4">
                  <p className="text-[#14134c] font-medium">Waiting for the Feud to start for quiz: <span className="font-bold">{quizInfo?.name || currentQuizId}</span>...</p>
                  {polling && (
                    <div className="mt-3">
                      <LoadingSpinner message="Checking status..." size="small" inline={true} />
                    </div>
                  )}
                </div>
                
                {!polling && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="w-full bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white px-6 py-3 rounded-xl hover:from-[#14134c]/90 hover:to-[#14134c] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-semibold"
                  >
                    Refresh Status
                  </button>
                )}
              </div>
            )}
            
            {started && countdown !== null && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-green-800 mb-2">
                  Feud Starting Soon!
                </div>
                <div className="text-5xl font-mono text-green-600 font-bold">
                  {countdown}s
                </div>
                <p className="text-green-700 mt-2 font-medium">Get ready to answer questions!</p>
              </div>
            )}
            
            {!error && (
              <div className="mt-6 text-[#14134c]/70 text-sm text-center font-medium">
                Please wait. The Feud will begin automatically when the admin starts it.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 