"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import Image from 'next/image';
import { getShortUserId } from '../../../lib/utils';

const QUESTION_TIME = 15; // seconds

export default function QuizPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(QUESTION_TIME);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [responseTime, setResponseTime] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]); // Store all answers locally
  const [clickedOptions, setClickedOptions] = useState(new Set()); // Prevent multiple clicks
  const [quizInfo, setQuizInfo] = useState(null);
  const [userId, setUserId] = useState('');
  const timerRef = useRef();
  const questionStart = useRef(Date.now());

  // Load questions from localStorage on mount
  useEffect(() => {
    const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
    if (storedQuiz) {
      const data = JSON.parse(storedQuiz);
      setQuestions(data.questions || []);
      setQuizInfo({ totalQuestions: data.questions?.length || 0 });
    }
    
    // Get user ID from cookies
    const id = Cookies.get('userId');
    setUserId(id);
  }, [quizId]);

  // Check for quiz restart and stop status
  useEffect(() => {
    const checkQuizStatus = async () => {
      try {
        const res = await fetch(`/api/quiz/${quizId}/quiz-info`);
        if (res.ok) {
          const quizData = await res.json();
          const lastRestartAt = quizData.lastRestartAt;
          
          // Check if quiz was stopped
          if (!quizData.active) {
            console.log('Quiz has been stopped by admin');
            setFeedback('Quiz has been stopped by admin. Redirecting to results...');
            setTimeout(() => {
              router.push(`/quiz/${quizId}/results`);
            }, 2000);
            return;
          }
          
          // Check if quiz was restarted after user started
          const userStartTime = localStorage.getItem(`quiz_${quizId}_start_time`);
          if (lastRestartAt && userStartTime) {
            const restartTime = new Date(lastRestartAt).getTime();
            const userStart = parseInt(userStartTime);
            
            if (restartTime > userStart) {
              // Quiz was restarted, reset user progress
              console.log('Quiz was restarted, resetting progress');
              setCurrent(0);
              setUserAnswers([]);
              setSelected(null);
              setClickedOptions(new Set());
              setFeedback('');
              setResponseTime(null);
              setSubmitting(false);
              
              // Clear local storage for this quiz
              localStorage.removeItem(`answers_${quizId}`);
              localStorage.setItem(`quiz_${quizId}_start_time`, Date.now().toString());
              
              // Show restart notification
              setFeedback('Quiz has been restarted! Starting from question 1.');
              setTimeout(() => setFeedback(''), 3000);
            }
          }
        }
      } catch (error) {
        console.error('Error checking quiz status:', error);
      }
    };

    // Check for status changes every 5 seconds
    const interval = setInterval(checkQuizStatus, 5000);
    checkQuizStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [quizId, router]);

  // Set start time when user begins quiz
  useEffect(() => {
    if (questions.length > 0 && current === 0) {
      localStorage.setItem(`quiz_${quizId}_start_time`, Date.now().toString());
    }
  }, [questions.length, current, quizId]);

  // Handle answer selection
  const handleAnswer = useCallback(async (optionIdx, auto = false) => {
    if (submitting) return;
    
    // Immediately prevent any further interaction
    setSubmitting(true);
    setSelected(optionIdx);
    setClickedOptions(prev => new Set([...prev, optionIdx]));
    clearInterval(timerRef.current);

    const q = questions[current];
    const now = Date.now();
    const responseTimeMs = now - questionStart.current;

    // Store answer locally
    const answerData = {
      questionId: q.id,
      selectedOption: optionIdx !== null ? String(optionIdx) : '',
      questionStartTimestamp: questionStart.current,
      responseTimeMs
    };

    setUserAnswers(prev => [...prev, answerData]);
    setResponseTime(responseTimeMs);
    setFeedback(auto ? 'Time up! Answer recorded.' : 'Answer recorded!');

    // Submit answer to backend
    try {
      const userId = Cookies.get('userId');
      await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answerData, userId, quizId })
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }

    // For last question, redirect immediately without delay
    if (current >= questions.length - 1) {
      // Quiz completed - redirect to waiting page immediately
      router.push(`/quiz/${quizId}/waiting`);
      return;
    }

    // For other questions, use the normal delay
    setTimeout(() => {
      setSubmitting(false);
      setSelected(null);
      setClickedOptions(new Set());
      setCurrent(c => c + 1);
    }, 1200);
  }, [submitting, questions, current, quizId, userAnswers, router]);

  // Timer logic
  useEffect(() => {
    if (questions.length === 0) return;
    setTimer(QUESTION_TIME);
    questionStart.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, questions.length, handleAnswer]);

  if (!questions.length) {
    return <LoadingSpinner />;
  }

  const q = questions[current];

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

      {/* User ID Badge - Top Right Corner */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20">
          <span className="text-sm font-mono text-[#14134c] font-semibold">
            ID: {userId ? getShortUserId(userId) : '0000'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full border border-white/20">
          {/* Header with Progress */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#14134c] mb-2">
                Question {current + 1} of {quizInfo?.totalQuestions}
              </h2>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-[#14134c] to-[#f8e0a0] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((current + 1) / quizInfo?.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* Timer */}
            <div className={`text-2xl sm:text-3xl font-mono font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
              timer <= 5 ? 'bg-red-500 text-white animate-pulse' : 
              timer <= 10 ? 'bg-yellow-500 text-white' : 
              'bg-[#14134c] text-white'
            }`}>
              {timer}s
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="text-lg sm:text-xl font-semibold text-[#14134c] leading-relaxed">
              {q.text}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={submitting || clickedOptions.has(idx)}
                className={`relative w-full py-4 px-4 rounded-xl border-2 text-base sm:text-lg font-medium shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                  ${selected === idx 
                    ? 'bg-gradient-to-r from-[#14134c] to-[#f8e0a0] text-white border-[#14134c] shadow-xl' 
                    : 'bg-white/80 text-[#14134c] border-gray-200 hover:bg-[#f8e0a0]/20 hover:border-[#f8e0a0]'
                  }
                  ${submitting || clickedOptions.has(idx) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                  ${clickedOptions.has(idx) ? 'ring-2 ring-[#14134c] ring-opacity-50' : ''}
                `}
              >
                {opt}
                {/* Loading indicator for clicked option */}
                {clickedOptions.has(idx) && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`mb-6 p-4 border rounded-xl text-center ${
              feedback.includes('restarted') 
                ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-200' 
                : 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-200'
            }`}>
              <div className={`font-semibold text-lg ${
                feedback.includes('restarted') ? 'text-purple-700' : 'text-green-700'
              }`}>
                {feedback.includes('restarted') && '🔄 '}{feedback}
              </div>
            </div>
          )}

          {/* Last Question Indicator */}
          {current >= questions.length - 1 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200 rounded-xl text-center">
              <div className="text-blue-700 font-semibold text-lg">
                🎯 Final Question - Choose carefully!
              </div>
              <div className="text-blue-600 text-sm mt-1">
                This is your last answer. Quiz will complete immediately after selection.
              </div>
            </div>
          )}



          {/* Progress Info */}
          <div className="text-center text-[#14134c]/70 text-sm font-medium">
            Progress: {current + 1} / {quizInfo?.totalQuestions} questions completed
          </div>
        </div>
      </div>
    </div>
  );
} 