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
    fetch(`/api/quiz/${quizId}/questions`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        setQuizInfo({
          totalQuestions: data.questions?.length || 0
        });
      });
  }, [quizId]);

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
  }, [submitting, questions, current, quizId, submitAnswer, submitAllAnswers]);

  // Submit answer to backend
  const submitAnswer = async (answerData) => {
    try {
      await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answerData)
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Submit all answers at the end
  const submitAllAnswers = async () => {
    setSubmittingAll(true);
    try {
      await fetch(`/api/quiz/${quizId}/submit-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers })
      });
      router.push(`/quiz/${quizId}/results`);
    } catch (error) {
      console.error('Error submitting all answers:', error);
    } finally {
      setSubmittingAll(false);
    }
  };

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
  }, [current, questions.length]);

  if (!questions.length) {
    return <LoadingSpinner />;
  }

  const q = questions[current];

  return (
    <div className="quiz-container">
      <h2>Question {current + 1} of {quizInfo?.totalQuestions}</h2>
      <div className="question-text">{q.text}</div>
      <div className="options">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            disabled={selected !== null || submitting || clickedOptions.has(idx)}
            className={`option-btn${selected === idx ? ' selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="timer">Time left: {timer}s</div>
      {feedback && <div className="feedback">{feedback}</div>}
      {submittingAll && <LoadingSpinner />}
    </div>
  );
} 