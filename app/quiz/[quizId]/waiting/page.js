"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Image from 'next/image';
import { getShortUserId } from '../../../../lib/utils';

export default function QuizWaitingPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [answerCount, setAnswerCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);
  const [userId, setUserId] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [sharedLeaderboard, setSharedLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    // Get user ID from cookies
    const id = Cookies.get('userId');
    const displayName = Cookies.get('displayName');
    const uniqueId = Cookies.get('uniqueId');
    setUserId(id);

    // Set user info from cookies
    if (displayName && uniqueId) {
      setUserInfo({
        displayName,
        uniqueId
      });
    }

    // Try to get answer count and quiz info from localStorage
    const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
    let answers = [];
    
    // Try different localStorage keys for answers
    const answersKey1 = `answers_${quizId}`;
    const answersKey2 = `userAnswers_${quizId}`;
    
    const storedAnswers1 = localStorage.getItem(answersKey1);
    const storedAnswers2 = localStorage.getItem(answersKey2);
    
    if (storedAnswers1) {
      try {
        answers = JSON.parse(storedAnswers1);
      } catch (e) {
        // console.error('Error parsing answers from localStorage:', e);
      }
    } else if (storedAnswers2) {
      try {
        answers = JSON.parse(storedAnswers2);
      } catch (e) {
        // console.error('Error parsing answers from localStorage:', e);
      }
    }
    
    // Filter out invalid answers (those without selectedOption or with empty selectedOption)
    const validAnswers = answers.filter(answer => 
      answer && 
      answer.selectedOption !== null && 
      answer.selectedOption !== undefined && 
      answer.selectedOption !== ''
    );
    
    if (storedQuiz) {
      const data = JSON.parse(storedQuiz);
      setQuizInfo({
        totalQuestions: data.questions?.length || 0,
        quizName: data.name || 'Quiz'
      });
    }
    
    setAnswerCount(validAnswers.length);
    setUserAnswers(validAnswers);
    setLoading(false);

    // Calculate user stats
    if (validAnswers.length > 0) {
      const totalTime = validAnswers.reduce((sum, answer) => sum + (answer.responseTimeMs || 0), 0);
      const avgTime = totalTime / validAnswers.length;
      setUserStats({
        totalQuestions: validAnswers.length,
        averageResponseTime: avgTime,
        totalTime: totalTime
      });
    }
    
    // If no answers found in localStorage, try to fetch from server as fallback
    if (validAnswers.length === 0 && id) {
      const fetchAnswersFromServer = async () => {
        try {
          const res = await fetch(`/api/quiz/${quizId}/user-answers?userId=${id}`);
          if (res.ok) {
            const serverAnswers = await res.json();
            if (serverAnswers.answers && serverAnswers.answers.length > 0) {
              const serverValidAnswers = serverAnswers.answers.filter(answer => 
                answer && 
                answer.selectedOption !== null && 
                answer.selectedOption !== undefined && 
                answer.selectedOption !== ''
              );
              setAnswerCount(serverValidAnswers.length);
              setUserAnswers(serverValidAnswers);
              
              if (serverValidAnswers.length > 0) {
                const totalTime = serverValidAnswers.reduce((sum, answer) => sum + (answer.responseTimeMs || 0), 0);
                const avgTime = totalTime / serverValidAnswers.length;
                setUserStats({
                  totalQuestions: serverValidAnswers.length,
                  averageResponseTime: avgTime,
                  totalTime: totalTime
                });
              }
            }
          }
        } catch (error) {
          // console.error('Error fetching answers from server:', error);
        }
      };
      
      fetchAnswersFromServer();
    }

    // Fetch shared leaderboard data
    const fetchSharedLeaderboard = async () => {
      if (!quizId) return;
      
      try {
        const res = await fetch(`/api/leaderboard/share?quizId=${quizId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.leaderboardData) {
            setSharedLeaderboard(data.leaderboardData);
            // console.log('Shared leaderboard loaded successfully');
          }
        } else if (res.status === 404) {
          // No shared leaderboard yet, this is normal
          // console.log('No shared leaderboard available yet for quiz:', quizId);
        } else {
          // console.error('Error fetching shared leaderboard:', res.status);
        }
      } catch (error) {
        // console.error('Error fetching shared leaderboard:', error);
      }
    };

    // Fetch leaderboard immediately
    fetchSharedLeaderboard();
    
    // Retry fetching leaderboard every 10 seconds for the first 2 minutes, then every 30 seconds
    let retryCount = 0;
    const maxQuickRetries = 12; // 2 minutes with 10-second intervals
    
    const leaderboardInterval = setInterval(() => {
      retryCount++;
      if (retryCount <= maxQuickRetries) {
        // Quick retries every 10 seconds for first 2 minutes
        fetchSharedLeaderboard();
      } else {
        // Slower retries every 30 seconds after 2 minutes
        if ((retryCount - maxQuickRetries) % 3 === 0) {
          fetchSharedLeaderboard();
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(leaderboardInterval);
    };
  }, [quizId]);

  // Instagram Icon Component
  const InstagramIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
    >
      <path 
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" 
        fill="url(#instagram-gradient)"
      />
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
    </svg>
  );

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
          <div className="text-center">
            {userInfo ? (
              <>
                <div className="text-sm font-semibold text-[#14134c]">
                  {userInfo.displayName}
                </div>
                <div className="text-xs font-mono text-[#14134c]/70">
                  ID: #{userInfo.uniqueId}
                </div>
              </>
            ) : (
              <span className="text-sm font-mono text-[#14134c] font-semibold">
                ID: {userId ? getShortUserId(userId) : '0000'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full border border-white/20">
          {loading ? (
            <LoadingSpinner message="Loading summary..." />
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#14134c] to-[#f8e0a0] rounded-full shadow-2xl mb-4">
                    <div className="text-3xl sm:text-4xl">✅</div>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#14134c] mb-3">
                  Quiz Completed!
                </h1>
                
              {/* Instagram Follow Section */}
              <div className="text-center mt-6 mb-6">
                <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-xl p-6 border border-pink-200/50 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-[#14134c] mb-3">
                    Stay Connected!
                  </h3>
                  <p className="text-[#14134c]/70 text-sm mb-4">
                    Follow us on Instagram for more quizzes, updates, and sports content
                  </p>
                  <a
                    href="https://www.instagram.com/rbu__sports?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.05] group"
                  >
                    <InstagramIcon />
                    <span>Follow @rbu__sports</span>
                    <svg 
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

                <p className="text-lg text-[#14134c]/70">
                  Great job! Your answers have been submitted successfully.
                </p>
              </div>

              {/* Quiz Summary */}
              <div className="bg-gradient-to-r from-[#14134c]/10 to-[#f8e0a0]/10 rounded-xl p-6 mb-6 border border-[#14134c]/20">
                <h2 className="text-xl font-bold text-[#14134c] mb-4 text-center">
                  Quiz Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-3xl font-bold text-[#14134c] mb-1">
                      {answerCount}
                    </div>
                    <div className="text-sm text-[#14134c]/70">
                      Questions Answered
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-3xl font-bold text-[#14134c] mb-1">
                      {quizInfo?.totalQuestions || 0}
                    </div>
                    <div className="text-sm text-[#14134c]/70">
                      Total Questions
                    </div>
                  </div>
                </div>
              </div>

              {/* User Performance Stats */}
              {userStats && (
                <div className="bg-gradient-to-r from-[#f8e0a0]/20 to-[#14134c]/10 rounded-xl p-6 mb-6 border border-[#f8e0a0]/30">
                  <h3 className="text-lg font-bold text-[#14134c] mb-4 text-center">
                    Your Performance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <span className="text-[#14134c]/80">Average Response Time:</span>
                      <span className="font-semibold text-[#14134c]">
                        {(userStats.averageResponseTime / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <span className="text-[#14134c]/80">Total Time:</span>
                      <span className="font-semibold text-[#14134c]">
                        {(userStats.totalTime / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <span className="text-[#14134c]/80">Completion Rate:</span>
                      <span className="font-semibold text-[#14134c]">
                        {Math.round((answerCount / quizInfo?.totalQuestions) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Answer Details */}
              {userAnswers.length > 0 && (
                <div className="bg-gradient-to-r from-[#14134c]/5 to-[#f8e0a0]/5 rounded-xl p-6 mb-6 border border-[#14134c]/10">
                  <h3 className="text-lg font-bold text-[#14134c] mb-4 text-center">
                    Answer Details
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {userAnswers.map((answer, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white/30 rounded-lg text-sm">
                        <span className="text-[#14134c]/70">Q{index + 1}:</span>
                        <span className="text-[#14134c] font-medium">
                          {answer.selectedOption ? `Option ${parseInt(answer.selectedOption) + 1}` : 'No answer'}
                        </span>
                        <span className="text-[#14134c]/60">
                          {(answer.responseTimeMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Message */}
              {!sharedLeaderboard && (
                <div className="text-center p-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-green-500/30 border-t-green-500"></div>
                    <span className="text-green-700 font-semibold text-lg">Processing Results</span>
                  </div>
                  <p className="text-green-700 text-sm">
                    Please wait while the results are being prepared.
                  </p>
                </div>
              )}

              {/* Back to Home Button */}
              <div className="text-center">
                <button
                  onClick={() => router.replace('/')}
                  className="bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white px-6 py-3 rounded-xl font-semibold hover:from-[#14134c]/90 hover:to-[#14134c] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Back to Home
                </button>
              </div>

              {/* Shared Leaderboard Section */}
              {sharedLeaderboard && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 mb-6 border border-green-200/30">
                  <h2 className="text-xl font-bold text-[#14134c] mb-4 text-center">
                    🏆 Final Results - Top {sharedLeaderboard.actualCount} Participants
                  </h2>
                  
                  {/* Leaderboard Stats */}
                  {sharedLeaderboard.stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-lg font-bold text-[#14134c]">
                          {sharedLeaderboard.stats.totalParticipants}
                        </div>
                        <div className="text-sm text-[#14134c]/70">Participants</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-lg font-bold text-[#14134c]">
                          {sharedLeaderboard.stats.averageScore?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="text-sm text-[#14134c]/70">Avg Score</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-lg font-bold text-[#14134c]">
                          {sharedLeaderboard.stats.highestScore || 'N/A'}
                        </div>
                        <div className="text-sm text-[#14134c]/70">Highest Score</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-lg font-bold text-[#14134c]">
                          {new Date(sharedLeaderboard.evaluatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-[#14134c]/70">Evaluated</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Leaderboard Table */}
                  <div className="bg-white/80 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#14134c]/10">
                            <th className="px-3 py-2 text-left text-sm font-semibold text-[#14134c]">Rank</th>
                            <th className="px-3 py-2 text-left text-sm font-semibold text-[#14134c]">Participant</th>
                            <th className="px-3 py-2 text-center text-sm font-semibold text-[#14134c]">Score</th>
                            <th className="px-3 py-2 text-center text-sm font-semibold text-[#14134c]">Correct</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sharedLeaderboard.entries.map((entry, index) => (
                            <tr key={entry.userId} className={`border-b border-[#14134c]/10 ${index < 3 ? 'bg-yellow-100/50' : ''}`}>
                              <td className="px-3 py-2">
                                <div className="flex items-center">
                                  {index === 0 && <span className="text-xl mr-1">🥇</span>}
                                  {index === 1 && <span className="text-xl mr-1">🥈</span>}
                                  {index === 2 && <span className="text-xl mr-1">🥉</span>}
                                  <span className={`font-semibold ${index < 3 ? 'text-yellow-600' : 'text-[#14134c]'}`}>
                                    #{entry.rank}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-semibold text-[#14134c]">{entry.displayName}</div>
                                  <div className="text-xs text-[#14134c]/60">#{entry.uniqueId}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="font-bold text-lg text-blue-600">{entry.score}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-[#14134c]/80">{entry.correctAnswers}/{entry.totalQuestions}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Loading/Status Section */}
              {!sharedLeaderboard && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 mb-6 border border-blue-200/30">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-lg font-semibold text-[#14134c] mb-2">
                      Waiting for Final Results
                    </h3>
                    <p className="text-[#14134c]/70 text-sm mb-4">
                      The leaderboard will appear here once the admin shares the final results.
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}