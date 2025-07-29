"use client";
import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Leaderboard</h1>
          <p className="text-gray-600 text-center">Top performers for the quiz</p>
        </div>
        {/* Leaderboard Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                The overall quiz leaderboard may not have been evaluated yet by the admin.
              </p>
            </div>
          ) : leaderboardData && leaderboardData.entries.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Top 10 Participants</h3>
              
              {/* Stats Summary */}
              {leaderboardData.stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{leaderboardData.stats.averageScore?.toFixed(1) || 'N/A'}</div>
                    <div className="text-sm text-blue-700">Average Score</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{leaderboardData.stats.highestScore || 'N/A'}</div>
                    <div className="text-sm text-green-700">Highest Score</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{leaderboardData.stats.averageAccuracy?.toFixed(1) || 'N/A'}%</div>
                    <div className="text-sm text-purple-700">Avg Accuracy</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{leaderboardData.stats.averageResponseTime?.toFixed(0) || 'N/A'}s</div>
                    <div className="text-sm text-orange-700">Avg Response Time</div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Participant</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Score</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Accuracy</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Response Time</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.entries.map((entry, index) => (
                      <tr key={entry.userId} className={`border-b border-gray-100 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                            {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                            {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                            <span className={`font-semibold ${index < 3 ? 'text-yellow-600' : 'text-gray-900'}`}>
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-semibold text-gray-900">{entry.displayName}</div>
                            <div className="text-sm text-gray-500">#{entry.uniqueId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-lg text-blue-600">{entry.score}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-green-600">{entry.accuracy?.toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-700">{entry.averageResponseTime?.toFixed(0)}s</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-700">{entry.correctAnswers}/{entry.totalQuestions}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Participants Yet</h3>
              <p className="text-gray-600">
                No participants have completed the quiz yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 