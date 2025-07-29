"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Image from 'next/image';

export default function QuizWaitingPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const [answerCount, setAnswerCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);
  const [userId, setUserId] = useState('');
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    // Get user ID from cookies
    const id = Cookies.get('userId');
    setUserId(id);

    // Try to get answer count and quiz info from localStorage
    const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
    const answers = JSON.parse(localStorage.getItem(`answers_${quizId}`) || '[]');
    
    if (storedQuiz) {
      const data = JSON.parse(storedQuiz);
      setQuizInfo({
        totalQuestions: data.questions?.length || 0,
        quizName: data.name || 'Quiz'
      });
    }
    
    setAnswerCount(answers.length);
    setUserAnswers(answers);
    setLoading(false);

    // Calculate user stats
    if (answers.length > 0) {
      const totalTime = answers.reduce((sum, answer) => sum + (answer.responseTimeMs || 0), 0);
      const avgTime = totalTime / answers.length;
      setUserStats({
        totalQuestions: answers.length,
        averageResponseTime: avgTime,
        totalTime: totalTime
      });
    }
  }, [quizId]);

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
            ID: {userId || 'Loading...'}
          </span>
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
              <div className="text-center p-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-200 rounded-xl">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-green-500/30 border-t-green-500"></div>
                  <span className="text-green-700 font-semibold text-lg">Processing Results</span>
                </div>
                <p className="text-green-700 text-sm">
                  Please wait while the results are being prepared. You will be redirected to the results page when they are ready.
                </p>
              </div>

              {/* Back to Home Button */}
              <div className="text-center mt-6">
                <button
                  onClick={() => router.replace('/')}
                  className="bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white px-6 py-3 rounded-xl font-semibold hover:from-[#14134c]/90 hover:to-[#14134c] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 