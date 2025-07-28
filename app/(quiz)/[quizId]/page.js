"use client";
import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  const timerRef = useRef();
  const questionStart = useRef(Date.now());

  useEffect(() => {
    fetch(`/api/quiz/${quizId}/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data.questions || []));
  }, [quizId]);

  useEffect(() => {
    if (questions.length === 0) return;
    setTimer(QUESTION_TIME);
    setSelected(null);
    setFeedback('');
    setResponseTime(null);
    questionStart.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(null, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [current, questions.length]);

  const handleSelect = idx => {
    if (selected !== null) return;
    setSelected(idx);
    handleSubmit(idx, false);
  };

  const handleSubmit = async (optionIdx, auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    const userId = Cookies.get('userId');
    const displayName = Cookies.get('displayName');
    const q = questions[current];
    const now = Date.now();
    const answerData = {
      userId,
      quizId,
      questionId: q.id,
      selectedOption: optionIdx !== null ? String(optionIdx) : '',
      questionStartTimestamp: questionStart.current
    };
    // Store user in users collection (fire and forget)
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, displayName })
    });
    // Submit answer
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answerData)
    });
    setResponseTime(now - questionStart.current);
    setFeedback(auto ? 'Time up! Answer submitted.' : 'Answer submitted!');
    setTimeout(() => {
      setSubmitting(false);
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
      } else {
        router.replace(`/(quiz)/${quizId}/results`);
      }
    }, 1200);
  };

  if (!questions.length) {
    return <LoadingSpinner message="Loading questions..." />;
  }

  const q = questions[current];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-xl font-bold mb-2">Question {current + 1} of {questions.length}</h1>
      <div className="mb-4 text-lg font-semibold">{q.text}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mb-4">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            className={`border rounded px-3 py-2 text-left ${selected === idx ? 'bg-blue-600 text-white' : 'bg-white'} ${selected !== null && selected !== idx ? 'opacity-60' : ''}`}
            disabled={selected !== null || submitting}
            onClick={() => handleSelect(idx)}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="mb-2">Time left: <span className="font-mono">{timer}s</span></div>
      {feedback && <div className="text-green-600 font-semibold mb-2">{feedback}</div>}
      {responseTime !== null && <div className="text-sm">Your response time: {responseTime / 1000}s</div>}
    </div>
  );
} 