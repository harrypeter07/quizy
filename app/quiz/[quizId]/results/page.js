"use client";
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../../components/LoadingSpinner';

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
    return <LoadingSpinner message="Loading results..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Quiz Results</h1>
          
                {userEntry ? (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-8 text-center">
          <div className="text-4xl font-bold mb-2">{userEntry.score}</div>
          <div className="text-xl">Your Score</div>
          <div className="mt-4 text-blue-100 space-y-1">
            <div>Rank: <span className="font-bold text-white">{leaderboard.indexOf(userEntry) + 1}</span> out of {leaderboard.length}</div>
            {userEntry.accuracy && (
              <div>Accuracy: <span className="font-bold text-white">{userEntry.accuracy}%</span></div>
            )}
            {userEntry.averageResponseTime && (
              <div>Avg Response: <span className="font-bold text-white">{(userEntry.averageResponseTime / 1000).toFixed(1)}s</span></div>
            )}
            {userEntry.correctAnswers && (
              <div>Correct: <span className="font-bold text-white">{userEntry.correctAnswers}/{userEntry.totalQuestions}</span></div>
            )}
          </div>
        </div>
      ) : (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl p-6 mb-8 text-center">
              <div className="text-2xl font-bold mb-2">Not in Top 20</div>
              <div className="text-yellow-100">Keep practicing to improve your rank!</div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Top 20 Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Rank</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Name</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700">Score</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700">Accuracy</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700">Speed</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr 
                    key={entry.userId} 
                    className={`border-b border-gray-100 ${
                      entry.userId === userId 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                                         <td className="py-3 px-4 font-medium text-gray-900">
                       {entry.displayName}
                       <span className="text-gray-500 text-sm ml-1">#{entry.uniqueId}</span>
                       {entry.userId === userId && (
                         <span className="ml-2 text-blue-600 text-sm">(You)</span>
                       )}
                     </td>
                                         <td className="py-3 px-4 text-center font-bold text-gray-900">
                       {entry.score}
                     </td>
                     <td className="py-3 px-4 text-center text-gray-700">
                       {entry.accuracy ? `${entry.accuracy}%` : '-'}
                     </td>
                     <td className="py-3 px-4 text-center text-gray-700">
                       {entry.averageResponseTime ? `${(entry.averageResponseTime / 1000).toFixed(1)}s` : '-'}
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
            onClick={() => router.replace('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
} 