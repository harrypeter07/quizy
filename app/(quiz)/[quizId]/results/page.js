"use client";
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';

export default function QuizResultsPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userEntry, setUserEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = Cookies.get('userId');

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data.entries || []);
      setLoading(false);
    }
    fetchLeaderboard();
  }, [quizId]);

  useEffect(() => {
    if (!leaderboard.length) return;
    const entry = leaderboard.find(e => e.userId === userId);
    setUserEntry(entry || null);
  }, [leaderboard, userId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz Results</h1>
      {userEntry ? (
        <div className="mb-6 p-4 border rounded bg-blue-50 w-full max-w-md text-center">
          <div className="text-lg font-semibold">Your Score: <span className="text-blue-700">{userEntry.score}</span></div>
          <div className="text-md">Rank: <span className="font-bold">{leaderboard.indexOf(userEntry) + 1}</span></div>
        </div>
      ) : (
        <div className="mb-6 p-4 border rounded bg-yellow-50 w-full max-w-md text-center">
          <div className="text-lg font-semibold text-yellow-700">You are not in the top 20.</div>
        </div>
      )}
      <h2 className="text-xl font-bold mb-2">Top 20 Leaderboard</h2>
      <div className="w-full max-w-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-1 px-2 text-left">Rank</th>
              <th className="py-1 px-2 text-left">Name</th>
              <th className="py-1 px-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr key={entry.userId} className={entry.userId === userId ? 'bg-blue-100 font-bold' : ''}>
                <td className="py-1 px-2">{idx + 1}</td>
                <td className="py-1 px-2">{entry.displayName}</td>
                <td className="py-1 px-2 text-right">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="mt-8 bg-blue-600 text-white rounded px-4 py-2"
        onClick={() => router.replace('/')}
      >
        Back to Home
      </button>
    </div>
  );
} 