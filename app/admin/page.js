"use client";
import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState('default');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [roundStatus, setRoundStatus] = useState(null);
  const [roundProgress, setRoundProgress] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [leaderboardType, setLeaderboardType] = useState('full');
  const [selectedRound, setSelectedRound] = useState(1);
  const [autoTransitionEnabled, setAutoTransitionEnabled] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    name: '',
    questionCount: 15,
    questionsPerRound: 5
  });
  const [userCountData, setUserCountData] = useState(null);
  const [currentQuizInfo, setCurrentQuizInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if token is stored in localStorage
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setAdminToken(storedToken);
      setIsAuthenticated(true);
      fetchDashboardData(storedToken);
    }
  }, []);

  useEffect(() => {
    if (selectedQuiz && isAuthenticated) {
      fetchDashboardData(adminToken);
      fetchUserCount();
      fetchRoundStatus();
      fetchRoundProgress();
    }
  }, [selectedQuiz, isAuthenticated, adminToken, fetchDashboardData, fetchUserCount, fetchRoundStatus, fetchRoundProgress]);

  // Auto refresh user count every 10 seconds (reduced frequency)
  useEffect(() => {
    if (!isAuthenticated || !selectedQuiz) return;
    
    const interval = setInterval(() => {
      fetchUserCount();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedQuiz, fetchUserCount]);

  // Auto refresh round progress every 5 seconds when quiz is active
  useEffect(() => {
    if (!isAuthenticated || !selectedQuiz || roundProgress?.roundStatus !== 'active') return;
    
    const interval = setInterval(() => {
      fetchRoundProgress();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedQuiz, roundProgress?.roundStatus, fetchRoundProgress]);

  // Auto transition check interval
  useEffect(() => {
    if (!isAuthenticated || !autoTransitionEnabled) return;
    
    const interval = setInterval(() => {
      handleAutoTransition();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated, autoTransitionEnabled, selectedQuiz, handleAutoTransition]);

  const handleLogin = async () => {
    if (!adminToken.trim()) {
      setStatus('Please enter admin token');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', adminToken);
        await fetchDashboardData(adminToken);
        setStatus('Login successful!');
      } else {
        setStatus('Invalid admin token');
      }
    } catch (error) {
      setStatus('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = useCallback(async (token) => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  const fetchRoundStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz/${selectedQuiz}/round-status`);
      if (res.ok) {
        const data = await res.json();
        setRoundStatus(data);
      }
    } catch (error) {
      console.error('Error fetching round status:', error);
    }
  }, [selectedQuiz]);

  const fetchRoundProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/quiz/${selectedQuiz}/round-progress`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoundProgress(data);
      }
    } catch (error) {
      console.error('Error fetching round progress:', error);
    }
  }, [selectedQuiz, adminToken]);

  const handleQuizAction = async (action, quizId = selectedQuiz) => {
    setLoading(true);
    setStatus(`${action} quiz...`);
    
    try {
      const endpoint = action === 'start' ? 'start' : action === 'stop' ? 'stop' : 'evaluate';
      const res = await fetch(`/api/admin/quiz/${quizId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (action === 'evaluate' && data.stats) {
          setStatus(`Evaluation complete! ${data.totalEvaluated} participants evaluated. Avg score: ${data.stats.averageScore}`);
        } else {
          setStatus(`${action} successful!`);
        }
        await fetchDashboardData(adminToken); // Refresh data
        await fetchRoundStatus(); // Refresh round status
        await fetchRoundProgress(); // Refresh round progress
      } else {
        setStatus(`${action} failed`);
      }
    } catch (error) {
      setStatus(`Error ${action}ing quiz`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoundAction = async (action, round = null) => {
    setLoading(true);
    setStatus(`${action} round...`);
    
    try {
      const res = await fetch(`/api/quiz/${selectedQuiz}/round-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, round })
      });
      
      if (res.ok) {
        setStatus(`Round ${action} successful!`);
        await fetchRoundStatus(); // Refresh round status
        await fetchRoundProgress(); // Refresh round progress
      } else {
        setStatus(`Round ${action} failed`);
      }
    } catch (error) {
      setStatus(`Error ${action}ing round`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoundEvaluation = async (round) => {
    setLoading(true);
    setStatus(`Evaluating round ${round}...`);
    
    try {
      const res = await fetch(`/api/admin/quiz/${selectedQuiz}/evaluate-round`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ round })
      });
      
      if (res.ok) {
        const data = await res.json();
        setStatus(`Round ${round} evaluation complete! Top 10 participants identified. Avg score: ${data.stats.averageScore}`);
        await fetchDashboardData(adminToken); // Refresh data
        await fetchRoundProgress(); // Refresh round progress
      } else {
        setStatus(`Round ${round} evaluation failed`);
      }
    } catch (error) {
      setStatus(`Error evaluating round ${round}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    setStatus('Loading leaderboard...');
    
    try {
      const params = new URLSearchParams({
        quizId: selectedQuiz,
        limit: leaderboardLimit,
        type: leaderboardType
      });
      
      if (leaderboardType === 'round') {
        params.append('round', selectedRound);
      }
      
      const res = await fetch(`/api/admin/leaderboard?${params}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
        setStatus(`Leaderboard loaded: ${data.actualCount} participants`);
      } else {
        const errorData = await res.json();
        setStatus(`Failed to load leaderboard: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const exportLeaderboard = () => {
    if (!leaderboardData) return;
    
    const csvContent = [
      ['Rank', 'Name', 'Unique ID', 'Score', 'Accuracy (%)', 'Avg Response Time (s)', 'Correct Answers', 'Total Questions'],
      ...leaderboardData.entries.map(entry => [
        entry.rank,
        entry.displayName,
        entry.uniqueId,
        entry.score,
        entry.accuracy?.toFixed(1) || 'N/A',
        entry.averageResponseTime?.toFixed(0) || 'N/A',
        entry.correctAnswers,
        entry.totalQuestions
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard-${selectedQuiz}-${leaderboardType}${leaderboardType === 'round' ? `-round${selectedRound}` : ''}-top${leaderboardLimit}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setStatus('Leaderboard exported successfully!');
  };

  const handleAutoTransition = useCallback(async () => {
    setLoading(true);
    setStatus('Checking auto transition...');
    
    try {
      const res = await fetch(`/api/quiz/${selectedQuiz}/auto-transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.action) {
          setStatus(`Auto transition: ${data.action}. ${data.nextRound ? `Advanced to round ${data.nextRound}` : 'Round paused'}`);
          await fetchRoundStatus(); // Refresh round status
          await fetchDashboardData(adminToken); // Refresh dashboard
        } else {
          setStatus('No auto transition needed');
        }
      } else {
        const errorData = await res.json();
        setStatus(`Auto transition failed: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error during auto transition');
    } finally {
      setLoading(false);
    }
  }, [selectedQuiz, fetchRoundStatus, fetchDashboardData, adminToken]);

  const handleCreateQuiz = async () => {
    if (!newQuizData.name.trim()) {
      setStatus('Please enter a quiz name');
      return;
    }
    
    setLoading(true);
    setStatus('Creating quiz...');
    
    try {
      const res = await fetch('/api/admin/quiz/create', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newQuizData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setStatus(`Quiz "${newQuizData.name}" created successfully!`);
        setShowCreateQuiz(false);
        setNewQuizData({ name: '', questionCount: 15, questionsPerRound: 5 });
        
        // Refresh dashboard data
        await fetchDashboardData(adminToken);
        
        // Automatically select the newly created quiz
        if (data.quizId) {
          setSelectedQuiz(data.quizId);
        }
        
        // Immediately fetch the current quiz info to ensure it's displayed
        await fetchCurrentQuizInfo();
        
        // Also fetch user count for the new quiz
        await fetchUserCount();
      } else {
        const errorData = await res.json();
        setStatus(`Failed to create quiz: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error creating quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminToken('');
    setDashboardData(null);
    localStorage.removeItem('adminToken');
    setStatus('Logged out');
  };

  const fetchUserCount = useCallback(async () => {
    try {
      if (selectedQuiz) {
        console.log('Fetching user count for quiz:', selectedQuiz);
        const res = await fetch(`/api/admin/quiz/${selectedQuiz}/user-count`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserCountData(data);
          console.log('User count updated successfully');
        } else {
          console.error('User count fetch failed:', res.status, res.statusText);
          const errorData = await res.json().catch(() => ({}));
          console.error('Error details:', errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
      // Don't show error to user for background polling
    }
  }, [selectedQuiz, adminToken]);

  const fetchCurrentQuizInfo = async () => {
    try {
      const res = await fetch('/api/quiz/recent');
      if (res.ok) {
        const data = await res.json();
        setCurrentQuizInfo(data);
        // Set the selected quiz to the recent quiz ID
        setSelectedQuiz(data.quizId);
      } else {
        console.error('Failed to fetch quiz info:', res.status);
      }
    } catch (error) {
      console.error('Error fetching quiz info:', error);
    }
  };

  const handleRefreshQuizDetails = async () => {
    setIsRefreshing(true);
    setStatus('Refreshing quiz details...');
    
    try {
      // Refresh all quiz-related data
      await Promise.all([
        fetchDashboardData(adminToken),
        fetchCurrentQuizInfo(),
        fetchUserCount(),
        fetchRoundStatus(),
        fetchRoundProgress()
      ]);
      
      setStatus('Quiz details refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing quiz details:', error);
      setStatus('Error refreshing quiz details');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <div className="space-y-4">
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="Admin Token"
              value={adminToken}
              onChange={e => setAdminToken(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              className="w-full bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {status && <div className="text-center text-sm">{status}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message={status} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Quiz Display */}
        {currentQuizInfo && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold">{currentQuizInfo.name || 'Loading...'}</h1>
                  {isRefreshing && (
                    <div className="ml-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span className="text-sm text-blue-100">Refreshing...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-blue-100">
                  <span className="flex items-center">
                    <span className="mr-2">📝</span>
                    {currentQuizInfo.questionCount} Questions
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">🔄</span>
                    {currentQuizInfo.totalRounds} Rounds
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">⏱️</span>
                    {currentQuizInfo.questionsPerRound} per Round
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">🎯</span>
                    Quiz ID: {selectedQuiz}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-blue-100 mt-2">
                  <span className="flex items-center">
                    <span className="mr-2">📅</span>
                    Created: {currentQuizInfo.formattedCreatedAt}
                  </span>
                </div>
                {/* Quiz Status Display */}
                <div className="mt-3">
                  {dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      🟢 Quiz Started
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      🔴 Quiz Stopped
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRefreshQuizDetails}
                  disabled={isRefreshing}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  onClick={() => setShowCreateQuiz(!showCreateQuiz)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  ➕ Create New Quiz
                </button>
                <button
                  onClick={() => handleQuizAction('start')}
                  disabled={dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active || loading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active ? '✅ Quiz Started' : '🚀 Start Quiz'}
                </button>
                <button
                  onClick={() => handleQuizAction('stop')}
                  disabled={!dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active || loading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    !dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {!dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active ? '⏹️ Quiz Stopped' : '⏹️ Stop Quiz'}
                </button>
                <button
                  onClick={() => handleQuizAction('evaluate')}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  📊 Evaluate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Creation Form - Show when creating new quiz */}
        {showCreateQuiz && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Create New Quiz</h3>
              <button
                onClick={() => setShowCreateQuiz(false)}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Quiz Name</label>
                <input
                  type="text"
                  value={newQuizData.name}
                  onChange={(e) => setNewQuizData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-blue-300 rounded px-3 py-2"
                  placeholder="Enter quiz name (e.g., Science Quiz, History Quiz)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Total Questions</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={newQuizData.questionCount}
                    onChange={(e) => setNewQuizData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full border border-blue-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Questions per Round</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={newQuizData.questionsPerRound}
                    onChange={(e) => setNewQuizData(prev => ({ ...prev, questionsPerRound: parseInt(e.target.value) }))}
                    className="w-full border border-blue-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateQuiz}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                🎯 Create Quiz
              </button>
            </div>
          </div>
        )}

        {/* Real-time User Counter */}
        {userCountData && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                👥 Real-time User Activity
              </h2>
              <div className="flex items-center text-green-600 text-sm font-medium">
                {isRefreshing ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-spin"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live Updates
                  </>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-4 text-center">
              Showing users who joined after this quiz was created ({userCountData.quizName})
            </div>
            
            {isRefreshing ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 font-medium">Refreshing user data...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{userCountData.totalUsers}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{userCountData.waitingUsers}</div>
                    <div className="text-sm text-gray-600">In Waiting Room</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{userCountData.activeUsers}</div>
                    <div className="text-sm text-gray-600">Active Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{userCountData.recentUsers}</div>
                    <div className="text-sm text-gray-600">Recently Joined</div>
                  </div>
                </div>
                
                {/* User List */}
                {userCountData.userList.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Users in Waiting Room</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {userCountData.userList.map((user, index) => (
                          <div key={user.userId} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-2">
                                {user.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{user.displayName}</div>
                                <div className="text-xs text-gray-500">#{user.uniqueId}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.joinedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Last updated: {new Date(userCountData.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Overall Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{dashboardData.overallStats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Answers</h3>
              <p className="text-3xl font-bold text-green-600">{dashboardData.overallStats.totalAnswers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Active Quizzes</h3>
              <p className="text-3xl font-bold text-orange-600">{dashboardData.overallStats.activeQuizzes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Quizzes</h3>
              <p className="text-3xl font-bold text-purple-600">{dashboardData.overallStats.totalQuizzes}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {['dashboard', 'quizzes', 'leaderboard', 'progress', 'users'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Quiz Overview</h2>
                {dashboardData?.quizStats.map((quiz) => (
                  <div key={quiz.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{quiz.name}</h3>
                        <p className="text-gray-600">{quiz.questionCount} questions</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          quiz.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {quiz.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                                         <div className="grid grid-cols-3 gap-4 text-sm">
                       <div>
                         <span className="text-gray-600">Users:</span>
                         <span className="ml-1 font-semibold">{quiz.userCount}</span>
                       </div>
                       <div>
                         <span className="text-gray-600">Answers:</span>
                         <span className="ml-1 font-semibold">{quiz.answerCount}</span>
                       </div>
                       <div>
                         <span className="text-gray-600">Leaderboard:</span>
                         <span className="ml-1 font-semibold">{quiz.leaderboard.length} entries</span>
                       </div>
                     </div>
                     {quiz.leaderboard.length > 0 && (
                       <div className="mt-3 text-xs text-gray-500">
                         Top 3: {quiz.leaderboard.slice(0, 3).map(entry => 
                           `${entry.displayName}#${entry.uniqueId}`
                         ).join(', ')}
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="space-y-6">
                {/* Current Round Information */}
                {roundProgress && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-blue-900">
                        Round {roundProgress.currentRound} Status
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={fetchRoundProgress}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          🔄 Refresh
                        </button>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          roundProgress.roundStatus === 'active' ? 'bg-green-100 text-green-800' :
                          roundProgress.roundStatus === 'paused' ? 'bg-orange-100 text-orange-800' :
                          roundProgress.roundStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {roundProgress.roundStatus === 'active' ? '🟢 Active' :
                           roundProgress.roundStatus === 'paused' ? '🟡 Paused' :
                           roundProgress.roundStatus === 'completed' ? '✅ Completed' :
                           '⚪ Inactive'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Round Timing */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-800">⏱️ Round Timing</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Started:</span>
                            <span className="font-medium">{roundProgress.roundStartTimeFormatted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{roundProgress.roundDurationFormatted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium capitalize">{roundProgress.roundStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* User Participation */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-800">👥 User Participation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Users:</span>
                            <span className="font-medium">{roundProgress.totalUsers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Users Answered:</span>
                            <span className="font-medium">{roundProgress.usersWithAnswers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completion:</span>
                            <span className={`font-medium ${
                              roundProgress.completionPercentage >= 90 ? 'text-green-600' :
                              roundProgress.completionPercentage >= 70 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {roundProgress.completionPercentage}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              roundProgress.completionPercentage >= 90 ? 'bg-green-500' :
                              roundProgress.completionPercentage >= 70 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${roundProgress.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Evaluation Status */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-800">📊 Evaluation Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Can Evaluate:</span>
                            <span className={`font-medium ${roundProgress.canEvaluate ? 'text-green-600' : 'text-gray-500'}`}>
                              {roundProgress.canEvaluate ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ready for Eval:</span>
                            <span className={`font-medium ${roundProgress.evaluationReady ? 'text-green-600' : 'text-gray-500'}`}>
                              {roundProgress.evaluationReady ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Threshold:</span>
                            <span className="font-medium">80% for eval, 90% for ready</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {roundProgress.roundStatus === 'active' && (
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 font-medium">
                            🟢 Round {roundProgress.currentRound} is currently ACTIVE - Users can submit answers
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleRoundAction('pause-round')}
                            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            ⏸️ Pause Round
                          </button>
                          {roundProgress.canEvaluate && (
                            <button
                              onClick={() => handleRoundEvaluation(roundProgress.currentRound)}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              📊 Evaluate Round {roundProgress.currentRound}
                            </button>
                          )}
                          {roundProgress.evaluationReady && (
                            <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2">
                              <p className="text-green-800 font-medium">
                                🎉 Round {roundProgress.currentRound} is ready for evaluation! 
                                All users have completed their answers.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {roundProgress.roundStatus === 'paused' && (
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-orange-800 font-medium">
                            🟡 Round {roundProgress.currentRound} is currently PAUSED - Users cannot submit answers
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleRoundAction('resume-round')}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            ▶️ Resume Round
                          </button>
                          <button
                            onClick={() => handleRoundEvaluation(roundProgress.currentRound)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            📊 Evaluate Round {roundProgress.currentRound}
                          </button>
                        </div>
                      </div>
                    )}

                    {roundProgress.roundStatus === 'completed' && (
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-3">
                          <p className="text-blue-800 font-medium">
                            ✅ Round {roundProgress.currentRound} completed successfully! 
                            You can now evaluate the results or start the next round.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz Status Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Quiz Control</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Use the Start/Stop buttons in the main header above to control the quiz.
                  </p>
                  <div className="text-sm text-blue-600">
                    <p>• Quiz Status: {dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active ? '🟢 Active' : '🔴 Inactive'}</p>
                    <p>• Current Round: {roundStatus?.currentRound || 1}</p>
                    <p>• Total Rounds: {roundStatus?.totalRounds || 1}</p>
                  </div>
                </div>



                {/* Auto Transition Toggle */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Auto Transition</h3>
                      <p className="text-sm text-gray-600">
                        Automatically pause rounds when complete or advance to next round.
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoTransitionEnabled}
                        onChange={(e) => setAutoTransitionEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoTransitionEnabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoTransitionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {autoTransitionEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Leaderboard Management</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={fetchLeaderboard}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Load Leaderboard
                    </button>
                    {leaderboardData && (
                      <button
                        onClick={exportLeaderboard}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
                </div>

                {/* Leaderboard Controls */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Leaderboard Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quiz</label>
                      <select
                        value={selectedQuiz}
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        {dashboardData?.quizStats.map((quiz) => (
                          <option key={quiz.id} value={quiz.id}>
                            {quiz.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={leaderboardType}
                        onChange={(e) => setLeaderboardType(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="full">Full Quiz</option>
                        <option value="round">Round Specific</option>
                      </select>
                    </div>
                    
                    {leaderboardType === 'round' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                        <select
                          value={selectedRound}
                          onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                          className="w-full border rounded px-3 py-2"
                        >
                                                  {Array.from({ length: roundStatus?.totalRounds || 3 }, (_, i) => i + 1).map(round => (
                          <option key={round} value={round}>Round {round}</option>
                        ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Top N Participants</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={leaderboardLimit}
                        onChange={(e) => setLeaderboardLimit(parseInt(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Leaderboard Display */}
                {leaderboardData ? (
                  <div className="space-y-4">
                    {/* Stats Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Leaderboard Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Quiz:</span>
                          <span className="ml-2 font-semibold">{leaderboardData.quizId}</span>
                        </div>
                        {leaderboardData.round && (
                          <div>
                            <span className="text-blue-700">Round:</span>
                            <span className="ml-2 font-semibold">{leaderboardData.round}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-blue-700">Participants:</span>
                          <span className="ml-2 font-semibold">{leaderboardData.totalParticipants}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Showing:</span>
                          <span className="ml-2 font-semibold">Top {leaderboardData.actualCount}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Average Score:</span>
                          <span className="ml-2 font-semibold">{leaderboardData.stats?.averageScore?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Highest Score:</span>
                          <span className="ml-2 font-semibold">{leaderboardData.stats?.highestScore || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Evaluated:</span>
                          <span className="ml-2 font-semibold">{new Date(leaderboardData.evaluatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-white border rounded-lg overflow-hidden">
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leaderboard Data</h3>
                    <p className="text-gray-600 mb-4">
                      Select your preferences and click &quot;Load Leaderboard&quot; to view results.
                    </p>
                    <p className="text-sm text-gray-500">
                      Make sure to evaluate the quiz or round first before loading the leaderboard.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Round Progress Tracking</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={fetchRoundProgress}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Refresh Progress
                    </button>
                    <button
                      onClick={handleAutoTransition}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Check Auto Transition
                    </button>
                  </div>
                </div>

                {roundProgress ? (
                  <div className="space-y-6">
                    {/* Round Statistics */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Round {roundProgress.currentRound} Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Status:</span>
                          <span className="ml-2 font-semibold capitalize">{roundProgress.roundStatus}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Total Users:</span>
                          <span className="ml-2 font-semibold">{roundProgress.totalUsers}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Users Answered:</span>
                          <span className="ml-2 font-semibold">{roundProgress.usersWithAnswers}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Completion:</span>
                          <span className="ml-2 font-semibold">{roundProgress.completionPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Duration:</span>
                          <span className="ml-2 font-semibold">{roundProgress.roundDurationFormatted}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Can Evaluate:</span>
                          <span className="ml-2 font-semibold">{roundProgress.canEvaluate ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Ready for Eval:</span>
                          <span className="ml-2 font-semibold">{roundProgress.evaluationReady ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Started:</span>
                          <span className="ml-2 font-semibold">{roundProgress.roundStartTimeFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Visualization */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Progress Visualization</h3>
                      
                      {/* Completion Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
                          <span className="text-sm font-semibold text-blue-600">{roundProgress.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full transition-all duration-300 ${
                              roundProgress.completionPercentage >= 90 ? 'bg-green-500' :
                              roundProgress.completionPercentage >= 70 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${roundProgress.completionPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${
                          roundProgress.roundStatus === 'active' ? 'border-green-200 bg-green-50' :
                          roundProgress.roundStatus === 'paused' ? 'border-orange-200 bg-orange-50' :
                          'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              roundProgress.roundStatus === 'active' ? 'bg-green-500' :
                              roundProgress.roundStatus === 'paused' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="font-semibold text-gray-900">Round Status</div>
                              <div className="text-sm text-gray-600 capitalize">{roundProgress.roundStatus}</div>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${
                          roundProgress.canEvaluate ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              roundProgress.canEvaluate ? 'bg-purple-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="font-semibold text-gray-900">Can Evaluate</div>
                              <div className="text-sm text-gray-600">{roundProgress.canEvaluate ? 'Yes' : 'No'}</div>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${
                          roundProgress.evaluationReady ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              roundProgress.evaluationReady ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="font-semibold text-gray-900">Ready for Eval</div>
                              <div className="text-sm text-gray-600">{roundProgress.evaluationReady ? 'Yes' : 'No'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data</h3>
                    <p className="text-gray-600 mb-4">
                      Click &quot;Refresh Progress&quot; to view current round progress information.
                    </p>
                    <p className="text-sm text-gray-500">
                      This will show you the current round status and completion progress.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600">User management features will be implemented here.</p>
                  <p className="text-sm text-gray-500 mt-2">Total registered users: {dashboardData?.overallStats.totalUsers}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            {status}
          </div>
        )}
      </div>
    </div>
  );
} 