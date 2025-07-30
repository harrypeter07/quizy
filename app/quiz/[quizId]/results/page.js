"use client";
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Image from 'next/image';
import { getShortUserId } from '../../../../lib/utils';

export default function QuizResultsPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userEntry, setUserEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    // Get user ID from cookies
    const id = Cookies.get('userId');
    setUserId(id);

    // Get user answers from localStorage
    const answers = JSON.parse(localStorage.getItem(`answers_${quizId}`) || '[]');
    setUserAnswers(answers);

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
      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/90 rounded-full shadow-2xl mb-4">
                <div className="text-3xl sm:text-4xl">🏆</div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
              Feud Results
            </h1>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block mb-4">
              <p className="text-white font-semibold text-lg sm:text-xl">
                Student Sports Club RBU
              </p>
            </div>
          </div>
          
          {/* User Score Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 border border-white/20">
            {userEntry ? (
              <div className="bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white rounded-xl p-6 mb-8 text-center shadow-xl">
                <div className="text-5xl font-bold mb-2">{userEntry.score}</div>
                <div className="text-xl font-semibold">Your Score</div>
                <div className="mt-4 text-white/90 space-y-2">
                  <div className="text-lg">Rank: <span className="font-bold text-white">{leaderboard.indexOf(userEntry) + 1}</span> out of {leaderboard.length}</div>
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
              <div className="bg-gradient-to-r from-[#f8e0a0] to-[#f8e0a0]/90 text-[#14134c] rounded-xl p-6 mb-8 text-center shadow-xl">
                <div className="text-2xl font-bold mb-2">Not in Top 20</div>
                <div className="text-[#14134c]/80">Keep practicing to improve your rank!</div>
              </div>
            )}

            {/* User Performance Details */}
            {userAnswers.length > 0 && (
              <div className="bg-gradient-to-r from-[#14134c]/10 to-[#f8e0a0]/10 rounded-xl p-6 mb-6 border border-[#14134c]/20">
                <h3 className="text-xl font-bold text-[#14134c] mb-4 text-center">Your Performance Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#14134c] mb-1">{userAnswers.length}</div>
                    <div className="text-sm text-[#14134c]/70">Questions Answered</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#14134c] mb-1">
                      {(userAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) / userAnswers.length / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-[#14134c]/70">Avg Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#14134c] mb-1">
                      {(userAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-[#14134c]/70">Total Time</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14134c] mb-6 text-center">Top 20 Leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#14134c]/10 border-b border-[#14134c]/20">
                    <th className="py-3 px-2 sm:px-4 text-left font-semibold text-[#14134c] text-sm sm:text-base">Rank</th>
                    <th className="py-3 px-2 sm:px-4 text-left font-semibold text-[#14134c] text-sm sm:text-base">Name</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-semibold text-[#14134c] text-sm sm:text-base">Score</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-semibold text-[#14134c] text-sm sm:text-base hidden sm:table-cell">Accuracy</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-semibold text-[#14134c] text-sm sm:text-base hidden lg:table-cell">Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr 
                      key={entry.userId} 
                      className={`border-b border-[#14134c]/10 ${
                        entry.userId === userId 
                          ? 'bg-[#f8e0a0]/20 border-l-4 border-l-[#f8e0a0]' 
                          : 'hover:bg-[#14134c]/5'
                      }`}
                    >
                      <td className="py-3 px-2 sm:px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                          idx === 1 ? 'bg-gray-100 text-gray-800' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-[#14134c]/10 text-[#14134c]'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 font-medium text-[#14134c] text-sm sm:text-base">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="font-semibold">{entry.displayName}</span>
                          <span className="text-[#14134c]/60 text-xs sm:text-sm ml-0 sm:ml-1">#{entry.uniqueId}</span>
                        </div>
                        {entry.userId === userId && (
                          <span className="text-[#f8e0a0] text-xs sm:text-sm font-semibold">(You)</span>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center font-bold text-[#14134c] text-base sm:text-lg">
                        {entry.score}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center text-[#14134c]/80 text-sm hidden sm:table-cell">
                        {entry.accuracy ? `${entry.accuracy}%` : '-'}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center text-[#14134c]/80 text-sm hidden lg:table-cell">
                        {entry.averageResponseTime ? `${(entry.averageResponseTime / 1000).toFixed(1)}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-8 space-y-4">
            <button
              className="bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white px-8 py-4 rounded-xl font-semibold hover:from-[#14134c]/90 hover:to-[#14134c] transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] text-lg w-full sm:w-auto"
              onClick={() => router.replace('/')}
            >
              Back to Home
            </button>
            <button
              className="bg-gradient-to-r from-[#f8e0a0] to-[#f8e0a0]/90 text-[#14134c] px-8 py-4 rounded-xl font-semibold hover:from-[#f8e0a0]/90 hover:to-[#f8e0a0] transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] text-lg w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              View Latest Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 