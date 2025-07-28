"use client";
import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getCurrentRound, shouldPauseAfterQuestion } from '@/lib/questions.js';

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
    
    checkRoundStatus();
    
    // Check round status every 2 seconds
    roundStatusInterval.current = setInterval(checkRoundStatus, 2000);
    
    return () => {
      if (roundStatusInterval.current) {
        clearInterval(roundStatusInterval.current);
      }
    };
  }, [quizId]);

  const checkRoundStatus = async () => {
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
  };

  // Calculate current round based on question number
  const getCurrentRoundLocal = (questionIndex) => {
    return getCurrentRound(questionIndex, quizInfo?.questionsPerRound || 5);
  };

  // Check if we should pause after this question
  const shouldPauseAfterQuestionLocal = (questionIndex) => {
    return shouldPauseAfterQuestion(questionIndex, quizInfo?.questionsPerRound || 5);
  };

  useEffect(() => {
    if (questions.length === 0 || isRoundPaused) return;
    
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
  }, [current, questions.length, isRoundPaused]);

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
    
    // Store answer locally
    const answerData = {
      questionId: q.id,
      selectedOption: optionIdx !== null ? String(optionIdx) : '',
      questionStartTimestamp: questionStart.current,
      responseTimeMs,
      round: getCurrentRoundLocal(current)
    };
    
    setUserAnswers(prev => [...prev, answerData]);
    setAnsweredThisRound(prev => prev + 1);
    setResponseTime(responseTimeMs);
    setFeedback(auto ? 'Time up! Answer recorded.' : 'Answer recorded!');
    
    // Submit answer immediately
    await submitAnswer(answerData);
    
    setTimeout(() => {
      setSubmitting(false);
      
      // Check if we should pause after this question
      if (shouldPauseAfterQuestionLocal(current)) {
        setFeedback('Round completed! Waiting for admin to resume...');
        setIsRoundPaused(true);
        return;
      }
      
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Round {currentRound} Completed!</h1>
          <p className="text-gray-600 mb-6">
            You&apos;ve answered {answeredThisRound} questions in this round.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold">Waiting for admin to resume...</p>
            <p className="text-blue-600 text-sm mt-2">
              The admin will evaluate results and start the next round.
            </p>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            <p>Total questions answered: {userAnswers.length}</p>
            <p>Current round: {currentRound} of {quizInfo?.totalRounds || 3}</p>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const currentQuestionRound = getCurrentRoundLocal(current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Question {current + 1} of {questions.length}
              </h1>
                        <p className="text-sm text-gray-600 mt-1">
            Round {currentQuestionRound} of {quizInfo?.totalRounds || 3} • {answeredThisRound} answered this round
          </p>
            </div>
            <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-2">
              <span className="text-red-800 font-mono text-lg">{timer}s</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
              {q.text}
            </h2>
            <div className="mt-2 text-sm text-blue-700">
              Question {current + 1} • Round {currentQuestionRound} of {quizInfo?.totalRounds || 3}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                selected === idx 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                  : selected !== null && selected !== idx 
                    ? 'bg-gray-100 text-gray-500 border-gray-200 opacity-60' 
                    : clickedOptions.has(idx)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 opacity-60 cursor-not-allowed'
                      : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
              disabled={selected !== null || submitting || clickedOptions.has(idx) || isRoundPaused}
              onClick={() => handleSelect(idx)}
            >
              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="text-green-800 font-semibold text-center">{feedback}</div>
            {shouldPauseAfterQuestionLocal(current) && (
              <div className="text-green-700 text-sm text-center mt-2">
                Round {currentQuestionRound} will end after this question.
              </div>
            )}
          </div>
        )}

        {/* Response Time */}
        {responseTime !== null && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <span className="text-gray-700 text-sm">
              Response time: <span className="font-mono font-semibold">{responseTime / 1000}s</span>
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Round {currentQuestionRound} Progress</span>
            <span>{Math.round(((answeredThisRound + 1) / (quizInfo?.questionsPerRound || 5)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((answeredThisRound + 1) / (quizInfo?.questionsPerRound || 5)) * 100}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {answeredThisRound + 1} of {quizInfo?.questionsPerRound || 5} questions in round {currentQuestionRound}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Total: {userAnswers.length} of {questions.length} questions answered
          </div>
        </div>
      </div>
    </div>
  );
} 