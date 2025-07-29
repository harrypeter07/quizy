"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
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
  const [clickedOptions, setClickedOptions] = useState(new Set()); // Prevent multiple clicks
  const [quizInfo, setQuizInfo] = useState(null);
  const timerRef = useRef();
  const questionStart = useRef(Date.now());

  // Load questions
  useEffect(() => {
    const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
    if (storedQuiz) {
      const data = JSON.parse(storedQuiz);
      setQuestions(data.questions || []);
      setQuizInfo({
        totalQuestions: data.questions?.length || 0
      });
    } else {
      // Fallback to API if not in localStorage (e.g., for new quizzes)
      fetch(`/api/quiz/${quizId}/questions`)
        .then(res => res.json())
        .then(data => {
          setQuestions(data.questions || []);
          setQuizInfo({
            totalQuestions: data.questions?.length || 0
          });
          localStorage.setItem(`quiz_${quizId}`, JSON.stringify(data));
        })
        .catch(error => {
          console.error('Error fetching questions from API:', error);
          setQuestions([]); // Clear questions on error
          setQuizInfo(null);
        });
    }
  }, [quizId]);

  // Submit answer to backend
  const submitAnswer = async (answerData) => {
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
  };

  // Submit all answers at the end
  const submitAllAnswers = async () => {
    setSubmittingAll(true);
    try {
      const userId = Cookies.get('userId');
      await fetch(`/api/quiz/${quizId}/submit-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quizId, answers: userAnswers })
      });
      router.push(`/quiz/${quizId}/waiting`);
    } catch (error) {
      console.error('Error submitting all answers:', error);
    } finally {
      setSubmittingAll(false);
    }
  };

  // Handle answer selection
  const handleAnswer = useCallback(async (optionIdx, auto = false) => {
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
      responseTimeMs
    };

    setUserAnswers(prev => [...prev, answerData]);
    setResponseTime(responseTimeMs);
    setFeedback(auto ? 'Time up! Answer recorded.' : 'Answer recorded!');

    await submitAnswer(answerData);

    setTimeout(() => {
      setSubmitting(false);
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
      } else {
        submitAllAnswers();
      }
    }, 1200);
  }, [submitting, questions, current, submitAnswer, submitAllAnswers]);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-800">Question {current + 1} of {quizInfo?.totalQuestions}</h2>
          <div className="text-lg font-mono text-indigo-600 font-bold">{timer}s</div>
        </div>
        <div className="mb-6">
          <div className="text-lg font-semibold text-gray-800 mb-2">{q.text}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null || submitting || clickedOptions.has(idx)}
              className={`w-full py-4 px-4 rounded-lg border text-lg font-medium shadow transition-all duration-150
                ${selected === idx ? 'bg-blue-600 text-white border-blue-700 scale-105' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-blue-100'}
                ${submitting || clickedOptions.has(idx) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
        {feedback && <div className="mb-4 text-green-700 font-semibold text-center">{feedback}</div>}
        {submittingAll && <LoadingSpinner message="Submitting answers..." />}
        <div className="mt-6 text-center text-gray-500 text-sm">
          Progress: {current + 1} / {quizInfo?.totalQuestions}
        </div>
      </div>
    </div>
  );
} 