"use client";
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Image from 'next/image';

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
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14134c] mb-6 text-center">Top 20 Leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#14134c]/10 border-b border-[#14134c]/20">
                    <th className="py-3 px-4 text-left font-semibold text-[#14134c]">Rank</th>
                    <th className="py-3 px-4 text-left font-semibold text-[#14134c]">Name</th>
                    <th className="py-3 px-4 text-center font-semibold text-[#14134c]">Score</th>
                    <th className="py-3 px-4 text-center font-semibold text-[#14134c]">Accuracy</th>
                    <th className="py-3 px-4 text-center font-semibold text-[#14134c]">Speed</th>
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
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                          idx === 1 ? 'bg-gray-100 text-gray-800' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-[#14134c]/10 text-[#14134c]'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#14134c]">
                        {entry.displayName}
                        <span className="text-[#14134c]/60 text-sm ml-1">#{entry.uniqueId}</span>
                        {entry.userId === userId && (
                          <span className="ml-2 text-[#f8e0a0] text-sm font-semibold">(You)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#14134c] text-lg">
                        {entry.score}
                      </td>
                      <td className="py-3 px-4 text-center text-[#14134c]/80">
                        {entry.accuracy ? `${entry.accuracy}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-[#14134c]/80">
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
              className="bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white px-8 py-4 rounded-xl font-semibold hover:from-[#14134c]/90 hover:to-[#14134c] transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] text-lg"
              onClick={() => router.replace('/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 