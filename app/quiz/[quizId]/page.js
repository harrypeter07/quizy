"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getCurrentRound, shouldPauseAfterQuestion } from '@/lib/questions.js';
import Image from 'next/image';

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
  const [submittingAll, setSubmittingAll] = useState(false);
  const [roundStatus, setRoundStatus] = useState(null);
  const [isRoundPaused, setIsRoundPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [answeredThisRound, setAnsweredThisRound] = useState(0);
  const [clickedOptions, setClickedOptions] = useState(new Set()); // Prevent multiple clicks
  const [quizInfo, setQuizInfo] = useState(null);
  const timerRef = useRef();
  const questionStart = useRef(Date.now());
  const roundStatusInterval = useRef();

  // Load questions and round status
  useEffect(() => {
    fetch(`/api/quiz/${quizId}/questions`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        // Calculate quiz info for dynamic rounds
        const totalQuestions = data.questions?.length || 0;
        const questionsPerRound = 5;
        const totalRounds = Math.ceil(totalQuestions / questionsPerRound);
        setQuizInfo({
          totalQuestions,
          totalRounds,
          questionsPerRound
        });
      });
    
    // Initial round status check
    checkRoundStatus();
  }, [quizId, checkRoundStatus]);

  const checkRoundStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz/${quizId}/round-status`);
      if (res.ok) {
        const status = await res.json();
        setRoundStatus(status);
        setIsRoundPaused(status.isPaused);
        setCurrentRound(status.currentRound);
        
        // If round is paused, show waiting message
        if (status.isPaused) {
          setFeedback('Round completed! Waiting for admin to resume...');
        }
      }
    } catch (error) {
      console.error('Error checking round status:', error);
    }
  }, [quizId]);

  // Calculate current round based on question number
  const getCurrentRoundLocal = useCallback((questionIndex) => {
    return getCurrentRound(questionIndex, quizInfo?.questionsPerRound || 5);
  }, [quizInfo?.questionsPerRound]);

  // Check if we should pause after this question
  const shouldPauseAfterQuestionLocal = (questionIndex) => {
    return shouldPauseAfterQuestion(questionIndex, quizInfo?.questionsPerRound || 5);
  };

  useEffect(() => {
    if (questions.length === 0 || isRoundPaused) return;
    
    // Check if current question belongs to the active round
    const currentQuestionRound = getCurrentRoundLocal(current);
    if (currentQuestionRound !== currentRound) {
      // Skip to the first question of the current round
      const firstQuestionOfRound = questions.findIndex(q => {
        const questionRound = Math.floor(q.id / questionsPerRound) + 1;
        return questionRound === currentRound;
      });
      
      if (firstQuestionOfRound !== -1) {
        setCurrent(firstQuestionOfRound);
      }
      return;
    }
    
    setTimer(QUESTION_TIME);
    setSelected(null);
    setFeedback('');
    setResponseTime(null);
    setClickedOptions(new Set()); // Reset clicked options for new question
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
  }, [current, questions.length, isRoundPaused, currentRound, getCurrentRoundLocal, handleAnswer, questions]);

  // Separate effect for round status checking (less frequent)
  useEffect(() => {
    if (isRoundPaused) return; // Don't check if already paused
    
    const checkStatusInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/quiz/${quizId}/round-status`);
        if (res.ok) {
          const status = await res.json();
          if (status.isPaused && !isRoundPaused) {
            setRoundStatus(status);
            setIsRoundPaused(true);
            setCurrentRound(status.currentRound);
            setFeedback('Round completed! Waiting for admin to resume...');
          } else if (!status.isPaused && isRoundPaused) {
            setRoundStatus(status);
            setIsRoundPaused(false);
            setCurrentRound(status.currentRound);
            setFeedback('');
          }
        }
      } catch (error) {
        console.error('Error checking round status:', error);
      }
    }, 3000); // Check every 3 seconds instead of every second
    
    return () => clearInterval(checkStatusInterval);
  }, [quizId, isRoundPaused]);

  const handleSelect = idx => {
    // Prevent multiple clicks on the same option
    if (clickedOptions.has(idx) || selected !== null || submitting || isRoundPaused) {
      return;
    }
    
    setClickedOptions(prev => new Set([...prev, idx]));
    setSelected(idx);
    handleAnswer(idx, false);
  };

  const handleAnswer = async (optionIdx, auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    
    const q = questions[current];
    const now = Date.now();
    const responseTimeMs = now - questionStart.current;
    
    // Get the current active round from backend before submitting
    let currentActiveRound = currentRound;
    try {
      const statusRes = await fetch(`/api/quiz/${quizId}/round-status`);
      if (statusRes.ok) {
        const status = await statusRes.json();
        currentActiveRound = status.currentRound;
        setCurrentRound(status.currentRound);
        setIsRoundPaused(status.isPaused);
      }
    } catch (error) {
      console.error('Error fetching current round status:', error);
    }
    
    // Store answer locally
    const answerData = {
      questionId: q.id,
      selectedOption: optionIdx !== null ? String(optionIdx) : '',
      questionStartTimestamp: questionStart.current,
      responseTimeMs,
      round: currentActiveRound // Use the current active round from backend
    };
    
    setUserAnswers(prev => [...prev, answerData]);
    setAnsweredThisRound(prev => prev + 1);
    setResponseTime(responseTimeMs);
    setFeedback(auto ? 'Time up! Answer recorded.' : 'Answer recorded!');
    
    // Check if this question belongs to the current active round
    const expectedRoundForQuestion = getCurrentRoundLocal(current);
    if (expectedRoundForQuestion !== currentActiveRound) {
      console.warn(`Question ${current + 1} belongs to round ${expectedRoundForQuestion}, but current active round is ${currentActiveRound}`);
      setFeedback(`Question ${current + 1} is not part of the current round. Skipping...`);
      setSubmitting(false);
      
      // Move to next question
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
      }
      return;
    }
    
    // Submit answer immediately
    await submitAnswer(answerData);
    
    // Check if this is the last question of the current round
    const isLastQuestionOfRound = shouldPauseAfterQuestionLocal(current);
    
    if (isLastQuestionOfRound) {
      // Immediately set round as paused and show waiting message
      setFeedback('Round completed! Waiting for admin to resume...');
      setIsRoundPaused(true);
      setSubmitting(false);
      
      // Trigger auto transition check in background (don't wait for response)
      fetch(`/api/quiz/${quizId}/auto-transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(error => {
        console.error('Auto transition check failed:', error);
      });
      
      return;
    }
    
    // For non-round-ending questions, trigger auto transition check
    try {
      await fetch(`/api/quiz/${quizId}/auto-transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Auto transition check failed:', error);
    }
    
    setTimeout(() => {
      setSubmitting(false);
      
      // Move to next question if not at the end
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
      } else {
        // Quiz completed
        submitAllAnswers();
      }
    }, 1200);
  };

  const submitAnswer = async (answerData) => {
    const userId = Cookies.get('userId');
    
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quizId,
          ...answerData
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Answer submission failed:', errorData.error);
        // Show user-friendly error message
        setFeedback('Failed to submit answer. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback('Network error. Answer saved locally.');
    }
  };

  const submitAllAnswers = async () => {
    setSubmittingAll(true);
    const userId = Cookies.get('userId');
    const displayName = Cookies.get('displayName');
    const uniqueId = Cookies.get('uniqueId');
    
    try {
      // Store user in users collection (fire and forget)
      if (userId && displayName && uniqueId) {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, displayName, uniqueId })
        });
      }
      
      // No need to submit all answers again since they're already submitted individually
      // Just redirect to results
      router.replace(`/quiz/${quizId}/results`);
    } catch (error) {
      console.error('Error in final submission:', error);
      router.replace(`/quiz/${quizId}/results`);
    } finally {
      setSubmittingAll(false);
    }
  };

  if (!questions.length) {
    return <LoadingSpinner message="Loading questions..." />;
  }

  if (submittingAll) {
    return <LoadingSpinner message="Submitting your answers..." />;
  }

  if (isRoundPaused) {
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
                  <div className="text-3xl sm:text-4xl">⏸️</div>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                Round {currentRound} Completed!
              </h1>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block mb-4">
                <p className="text-white font-semibold text-lg sm:text-xl">
                  Student Sports Club RBU
                </p>
              </div>
              <p className="text-white/90 text-lg sm:text-xl font-medium drop-shadow-md">
                You&apos;ve answered {answeredThisRound} questions in this round.
              </p>
            </div>
            
            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
              <div className="bg-gradient-to-r from-[#f8e0a0]/20 to-[#14134c]/10 border border-[#14134c]/20 rounded-xl p-6 text-center">
                <p className="text-[#14134c] font-semibold text-lg mb-2">Waiting for admin to resume...</p>
                <p className="text-[#14134c]/70 text-sm">
                  The admin will evaluate results and start the next round.
                </p>
              </div>
              
              <div className="mt-6 text-center space-y-2">
                <p className="text-[#14134c]/80 text-sm font-medium">
                  Total questions answered: {userAnswers.length}
                </p>
                <p className="text-[#14134c]/80 text-sm font-medium">
                  Current round: {currentRound} of {quizInfo?.totalRounds || 3}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const currentQuestionRound = getCurrentRoundLocal(current);
  const isQuestionInActiveRound = currentQuestionRound === currentRound;

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
      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Warning Banner if question is not in active round */}
          {!isQuestionInActiveRound && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 mb-4 shadow-lg">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">⚠️</span>
                  <div className="text-center">
                    <p className="font-semibold">Question {current + 1} is not part of the current round</p>
                    <p className="text-sm opacity-90">This question belongs to Round {currentQuestionRound}, but Round {currentRound} is currently active.</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrent(c => c + 1)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Skip to Next Question
                </button>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#14134c]">
                  Question {current + 1} of {questions.length}
                </h1>
                <p className="text-sm text-[#14134c]/70 mt-1 font-medium">
                  Round {currentQuestionRound} of {quizInfo?.totalRounds || 3} • {answeredThisRound} answered this round
                </p>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl px-4 py-3 shadow-lg">
                <span className="font-mono text-xl sm:text-2xl font-bold">{timer}s</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#f8e0a0]/20 to-[#14134c]/10 border border-[#14134c]/20 rounded-xl p-6 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#14134c] leading-relaxed">
                {q.text}
              </h2>
              <div className="mt-3 text-sm text-[#14134c]/70 font-medium">
                Question {current + 1} • Round {currentQuestionRound} of {quizInfo?.totalRounds || 3}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                className={`p-4 sm:p-6 text-left rounded-xl border-2 transition-all duration-200 font-medium text-lg ${
                  selected === idx 
                    ? 'bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white border-[#14134c] shadow-xl transform scale-[1.02]' 
                    : selected !== null && selected !== idx 
                      ? 'bg-white/60 text-[#14134c]/50 border-[#14134c]/20 opacity-60' 
                      : clickedOptions.has(idx)
                        ? 'bg-white/60 text-[#14134c]/50 border-[#14134c]/20 opacity-60 cursor-not-allowed'
                        : !isQuestionInActiveRound
                          ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white/95 text-[#14134c] border-[#14134c]/20 hover:border-[#f8e0a0] hover:shadow-lg hover:bg-white transform hover:scale-[1.01]'
                }`}
                disabled={selected !== null || submitting || clickedOptions.has(idx) || isRoundPaused || !isQuestionInActiveRound}
                onClick={() => handleSelect(idx)}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span> {opt}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4 shadow-lg">
              <div className="text-green-800 font-semibold text-center text-lg">{feedback}</div>
              {shouldPauseAfterQuestionLocal(current) && (
                <div className="text-green-700 text-sm text-center mt-2 font-medium">
                  Round {currentQuestionRound} will end after this question.
                </div>
              )}
            </div>
          )}

          {/* Response Time */}
          {responseTime !== null && (
            <div className="bg-white/80 backdrop-blur-sm border border-[#14134c]/20 rounded-xl p-3 text-center shadow-lg mb-4">
              <span className="text-[#14134c] text-sm font-medium">
                Response time: <span className="font-mono font-bold text-lg">{responseTime / 1000}s</span>
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="flex justify-between text-sm text-[#14134c] mb-3 font-semibold">
              <span>Round {currentQuestionRound} Progress</span>
              <span>{Math.round(((answeredThisRound + 1) / (quizInfo?.questionsPerRound || 5)) * 100)}%</span>
            </div>
            <div className="w-full bg-[#14134c]/20 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-[#14134c] to-[#f8e0a0] h-3 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${((answeredThisRound + 1) / (quizInfo?.questionsPerRound || 5)) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-[#14134c]/70 text-center font-medium mb-1">
              {answeredThisRound + 1} of {quizInfo?.questionsPerRound || 5} questions in round {currentQuestionRound}
            </div>
            <div className="text-xs text-[#14134c]/70 text-center font-medium">
              Total: {userAnswers.length} of {questions.length} questions answered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 