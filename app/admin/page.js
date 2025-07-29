"use client";
import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { questionSets } from '../../lib/questionSets';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState('default');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [leaderboardType, setLeaderboardType] = useState('full');
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    name: '',
    questionCount: 15,
  });
  const [userCountData, setUserCountData] = useState(null);
  const [currentQuizInfo, setCurrentQuizInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState('default');
  const [availableQuestionSets, setAvailableQuestionSets] = useState(questionSets);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Define all callback functions first
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

  const fetchUserCount = useCallback(async () => {
    if (!selectedQuiz) return;
    try {
      const res = await fetch(`/api/quiz/${selectedQuiz}/user-count`);
      if (res.ok) {
        const data = await res.json();
        setUserCountData(data);
      } else {
        setUserCountData({ totalUsers: 0, waitingUsers: 0, activeUsers: 0, recentUsers: 0 });
      }
    } catch (error) {
      setUserCountData({ totalUsers: 0, waitingUsers: 0, activeUsers: 0, recentUsers: 0 });
    }
  }, [selectedQuiz]);



  // Remove all round-related state
  // Remove roundStatus, roundProgress, selectedRound, autoTransitionEnabled, and any round-based state
  // Remove all round-related functions: fetchRoundStatus, fetchRoundProgress, handleAutoTransition, handleRoundAction, handleRoundEvaluation, etc.
  // Remove all round-based UI: Start Quiz & Round 1, Pause/Resume/Evaluate Round, round progress, round status, round statistics, round-based leaderboard controls
  // Only keep quiz-level controls: start, stop, evaluate, validate, create
  // Remove any references to 'round' in state, handlers, and UI

  // Now define useEffect hooks after the functions
  useEffect(() => {
    // Check if token is stored in localStorage
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setAdminToken(storedToken);
      setIsAuthenticated(true);
      fetchDashboardData(storedToken);
    }
  }, [fetchDashboardData]);

  // Always use the most recent quiz for all controls and info
  useEffect(() => {
    if (dashboardData && dashboardData.quizStats && dashboardData.quizStats.length > 0) {
      const latestQuiz = dashboardData.quizStats.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      setSelectedQuiz(latestQuiz.id);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (selectedQuiz && isAuthenticated) {
      fetchDashboardData(adminToken);
      fetchUserCount();
      // Removed fetchRoundStatus() and fetchRoundProgress()
    }
  }, [selectedQuiz, isAuthenticated, adminToken, fetchDashboardData, fetchUserCount]);

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
    if (!isAuthenticated || !selectedQuiz) return;
    
    const interval = setInterval(() => {
      // Removed fetchRoundProgress()
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedQuiz]);

  // Auto transition check interval
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      // Removed handleAutoTransition()
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Auto-load leaderboard when tab, quiz, or limit changes
  useEffect(() => {
    if (activeTab === 'leaderboard' && selectedQuiz && adminToken) {
      // Call fetchLeaderboard directly to avoid dependency issues
      const loadLeaderboard = async () => {
        setLeaderboardLoading(true);
        try {
          const res = await fetch(`/api/admin/leaderboard?quizId=${selectedQuiz}&limit=${leaderboardLimit}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setLeaderboardData(data);
          } else {
            setLeaderboardData(null);
          }
        } catch (error) {
          setLeaderboardData(null);
        } finally {
          setLeaderboardLoading(false);
        }
      };
      loadLeaderboard();
    }
  }, [activeTab, selectedQuiz, leaderboardLimit, adminToken]);

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

  const handleQuizAction = async (action, quizId = selectedQuiz) => {
    setLoading(true);
    setStatus(`${action} quiz...`);
    
    try {
      const endpoint = action === 'start' ? 'start' : 'stop';
      const res = await fetch(`/api/admin/quiz/${quizId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStatus(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
        await fetchDashboardData(adminToken); // Refresh data
      } else {
        setStatus(`${action.charAt(0).toUpperCase() + action.slice(1)} failed`);
      }
    } catch (error) {
      setStatus(`Error ${action}ing quiz`);
    } finally {
      setLoading(false);
    }
  };

  // Removed handleRoundAction, handleRoundEvaluation, fetchLeaderboard, exportLeaderboard

  const handleCreateQuiz = async () => {
    if (!newQuizData.name.trim()) {
      setStatus('Please enter a quiz name');
      return;
    }
    
    setLoading(true);
    setStatus('Creating quiz...');
    
    try {
      const selectedSet = availableQuestionSets.find(set => set.key === selectedQuestionSet);
      const res = await fetch('/api/admin/quiz/create', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newQuizData, questions: selectedSet.questions })
      });
      
      if (res.ok) {
        const data = await res.json();
        setStatus(`Quiz "${newQuizData.name}" created successfully!`);
        setShowCreateQuiz(false);
        setNewQuizData({ name: '', questionCount: 15 });
        
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
        // Removed fetchRoundStatus() and fetchRoundProgress()
      ]);
      
      setStatus('Quiz details refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing quiz details:', error);
      setStatus('Error refreshing quiz details');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleValidateData = async () => {
    setLoading(true);
    setStatus('Calculating user scores...');
    
    try {
      const res = await fetch(`/api/admin/quiz/${selectedQuiz}/validate-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const { validationReport } = data;
        
        if (validationReport.issues.length === 0) {
          setStatus(`✅ Scores calculated successfully! ${validationReport.participants?.totalUsers || 0} participants processed.`);
        } else {
          const issueCount = validationReport.issues.reduce((sum, issue) => sum + issue.count, 0);
          setStatus(`✅ Scores calculated! ${validationReport.participants?.totalUsers || 0} participants processed. Found ${issueCount} data issues.`);
          console.log('Data validation issues:', validationReport.issues);
        }
      } else {
        const errorData = await res.json();
        setStatus(`Score calculation failed: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error calculating scores');
    } finally {
      setLoading(false);
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

  const isQuizActive = dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active;

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
                  {isQuizActive ? (
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
                  disabled={isQuizActive || loading}
                  className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:text-gray-600"
                >
                  🚀 Start Quiz
                </button>
                <button
                  onClick={() => handleQuizAction('stop')}
                  disabled={!isQuizActive || loading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    !isQuizActive
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {!isQuizActive ? '⏹️ Quiz Stopped' : '⏹️ Stop Quiz'}
                </button>
                <button
                  onClick={() => handleQuizAction('evaluate')}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  📊 Evaluate
                </button>
                <button
                  onClick={handleValidateData}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  🔍 Validate Data
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
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Question Set</label>
                <select
                  value={selectedQuestionSet}
                  onChange={e => setSelectedQuestionSet(e.target.value)}
                  className="w-full border border-blue-300 rounded px-3 py-2"
                >
                  {availableQuestionSets.map(set => (
                    <option key={set.key} value={set.key}>{set.name}</option>
                  ))}
                </select>
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
                    <div className="text-3xl font-bold text-blue-600">{userCountData.totalUsers ?? 0}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{userCountData.waitingUsers ?? 0}</div>
                    <div className="text-sm text-gray-600">In Waiting Room</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{userCountData.activeUsers ?? 0}</div>
                    <div className="text-sm text-gray-600">Active Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{userCountData.recentUsers ?? 0}</div>
                    <div className="text-sm text-gray-600">Recently Joined</div>
                  </div>
                </div>
                
                {/* User List */}
                {(userCountData.userList ?? []).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Users in Waiting Room</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(userCountData.userList ?? []).map((user, index) => (
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
                      Last updated: {userCountData.lastUpdated ? new Date(userCountData.lastUpdated).toLocaleTimeString() : '--'}
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
                {dashboardData?.quizStats && dashboardData.quizStats.length > 0 && (
                  <div className="mb-4">
                    <label htmlFor="quiz-select" className="mr-2 font-semibold">Select Quiz:</label>
                    <select
                      id="quiz-select"
                      value={selectedQuiz}
                      onChange={e => setSelectedQuiz(e.target.value)}
                      className="px-3 py-2 rounded border"
                    >
                      {dashboardData.quizStats.map(quiz => (
                        <option key={quiz.id} value={quiz.id}>
                          {quiz.name} ({quiz.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Show selected quiz info */}
                {dashboardData?.quizStats && selectedQuiz && (
                  (() => {
                    const quiz = dashboardData.quizStats.find(q => q.id === selectedQuiz);
                    if (!quiz) return null;
                    return (
                      <div className="mb-4 p-4 border rounded bg-gray-50">
                        <h3 className="text-lg font-semibold mb-1">{quiz.name}</h3>
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div><span className="text-gray-600">Questions:</span> <span className="font-semibold">{quiz.questionCount}</span></div>
                          <div><span className="text-gray-600">Answers:</span> <span className="font-semibold">{quiz.answerCount}</span></div>
                          <div><span className="text-gray-600">Participants:</span> <span className="font-semibold">{quiz.userCount}</span></div>
                          <div><span className="text-gray-600">Status:</span> <span className={`font-semibold ${quiz.active ? 'text-green-700' : 'text-gray-500'}`}>{quiz.active ? 'Active' : 'Inactive'}</span></div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {dashboardData && selectedQuiz && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <button onClick={() => handleQuizAction('start')} disabled={!isQuizActive || loading} className="px-6 py-3 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:text-gray-600">{isQuizActive ? '✅ Quiz Started' : '🚀 Start Quiz'}</button>
                    <button onClick={() => handleQuizAction('stop')} disabled={!isQuizActive || loading} className="px-6 py-3 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-400 disabled:text-gray-600">{!isQuizActive ? '⏹️ Quiz Stopped' : '⏹️ Stop Quiz'}</button>

                    <button onClick={handleValidateData} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold">📊 Calculate Scores</button>
                    <button onClick={() => setShowCreateQuiz(!showCreateQuiz)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">➕ Create New Quiz</button>
                  </div>
                )}

                {/* Current Round Information */}
                {/* Removed roundProgress and round-related UI */}

                {/* Quiz Status Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Quiz Control</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Use the Start/Stop buttons in the main header above to control the quiz.
                  </p>
                  <div className="text-sm text-blue-600">
                    <p>• Quiz Status: {isQuizActive ? '🟢 Active' : '🔴 Inactive'}</p>
                  </div>
                </div>



                {/* Auto Transition Toggle */}
                {/* Removed autoTransitionEnabled and auto transition UI */}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Leaderboard Management</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={async () => {
                        if (!selectedQuiz) return;
                        setLeaderboardLoading(true);
                        try {
                          const res = await fetch(`/api/admin/leaderboard?quizId=${selectedQuiz}&limit=${leaderboardLimit}`, {
                            headers: { 'Authorization': `Bearer ${adminToken}` }
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setLeaderboardData(data);
                          } else {
                            setLeaderboardData(null);
                          }
                        } catch (error) {
                          setLeaderboardData(null);
                        } finally {
                          setLeaderboardLoading(false);
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      disabled={leaderboardLoading}
                    >
                      {leaderboardLoading ? 'Loading...' : 'Load Leaderboard'}
                    </button>
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
                    
                    {/* Removed leaderboardType === 'round' && ( ... ) */}
                    
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
                        {/* Removed leaderboardData.round */}
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
                          <span className="text-blue-700">Calculated:</span>
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
                      No leaderboard data available. Make sure to calculate scores first and click &quot;Load Leaderboard&quot;.
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
                    {/* Removed fetchRoundProgress and handleAutoTransition button and calls in progress tab */}
                  </div>
                </div>

                {/* Removed roundProgress and round-related UI */}
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