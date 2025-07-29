"use client";
import { useState, useEffect } from 'react';
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
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [leaderboardType, setLeaderboardType] = useState('full');
  const [selectedRound, setSelectedRound] = useState(1);
  const [roundProgressData, setRoundProgressData] = useState(null);
  const [autoTransitionEnabled, setAutoTransitionEnabled] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    name: '',
    questionCount: 15,
    questionsPerRound: 5
  });

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
    if (isAuthenticated) {
      fetchRoundStatus();
    }
  }, [selectedQuiz, isAuthenticated]);

  // Auto transition check interval
  useEffect(() => {
    if (!isAuthenticated || !autoTransitionEnabled) return;
    
    const interval = setInterval(() => {
      handleAutoTransition();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated, autoTransitionEnabled, selectedQuiz]);

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

  const fetchDashboardData = async (token) => {
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
  };

  const fetchRoundStatus = async () => {
    try {
      const res = await fetch(`/api/quiz/${selectedQuiz}/round-status`);
      if (res.ok) {
        const status = await res.json();
        setRoundStatus(status);
      }
    } catch (error) {
      console.error('Error fetching round status:', error);
    }
  };

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

  const fetchRoundProgress = async (round = selectedRound) => {
    setLoading(true);
    setStatus('Loading round progress...');
    
    try {
      const res = await fetch(`/api/admin/quiz/${selectedQuiz}/round-progress?round=${round}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRoundProgressData(data);
        setStatus(`Round ${round} progress loaded`);
      } else {
        const errorData = await res.json();
        setStatus(`Failed to load progress: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error loading round progress');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTransition = async () => {
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
  };

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
        await fetchDashboardData(adminToken); // Refresh dashboard
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
                {/* Quiz Creation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-blue-900">Create New Quiz</h3>
                    <button
                      onClick={() => setShowCreateQuiz(!showCreateQuiz)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {showCreateQuiz ? 'Cancel' : 'Create Quiz'}
                    </button>
                  </div>
                  
                  {showCreateQuiz && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Quiz Name</label>
                        <input
                          type="text"
                          value={newQuizData.name}
                          onChange={(e) => setNewQuizData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full border border-blue-300 rounded px-3 py-2"
                          placeholder="Enter quiz name"
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
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        Create Quiz
                      </button>
                    </div>
                  )}
                </div>

                {/* Quiz Selection */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Quiz Management</h2>
                  <select
                    value={selectedQuiz}
                    onChange={(e) => setSelectedQuiz(e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    {dashboardData?.quizStats.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Quiz Status */}
                {roundStatus && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">Current Quiz Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-700 font-medium">Quiz:</span>
                        <span className="ml-2 font-semibold">{dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.name}</span>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Round:</span>
                        <span className="ml-2 font-semibold">{roundStatus.currentRound} of {roundStatus.totalRounds || 3}</span>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Status:</span>
                        <span className={`ml-2 font-semibold ${roundStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {roundStatus.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Paused:</span>
                        <span className={`ml-2 font-semibold ${roundStatus.isPaused ? 'text-orange-600' : 'text-green-600'}`}>
                          {roundStatus.isPaused ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Users:</span>
                        <span className="ml-2 font-semibold">{dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.userCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Answers:</span>
                        <span className="ml-2 font-semibold">{dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.answerCount || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleQuizAction('start')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Start Quiz
                  </button>
                  <button
                    onClick={() => handleQuizAction('stop')}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Stop Quiz
                  </button>
                  <button
                    onClick={() => handleQuizAction('evaluate')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Evaluate Quiz
                  </button>
                </div>

                {/* Round Actions */}
                {roundStatus && roundStatus.isActive && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">Round {roundStatus.currentRound} Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => handleRoundAction('pause-round')}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                      >
                        Pause Round
                      </button>
                      <button
                        onClick={() => handleRoundEvaluation(roundStatus.currentRound)}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                      >
                        Evaluate Round {roundStatus.currentRound}
                      </button>
                      <button
                        onClick={handleAutoTransition}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      >
                        Auto Transition
                      </button>
                    </div>
                  </div>
                )}

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
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                      className="border rounded px-3 py-2"
                    >
                      {Array.from({ length: roundStatus?.totalRounds || 3 }, (_, i) => i + 1).map(round => (
                        <option key={round} value={round}>Round {round}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => fetchRoundProgress()}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Load Progress
                    </button>
                    <button
                      onClick={handleAutoTransition}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Check Auto Transition
                    </button>
                  </div>
                </div>

                {roundProgressData ? (
                  <div className="space-y-6">
                    {/* Round Statistics */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Round {selectedRound} Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Total Questions:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.totalQuestions}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Total Answers:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.totalAnswers}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Unique Users:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.uniqueUsers}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Completion:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.completionPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Questions with Answers:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.questionsWithAnswers}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Questions without Answers:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.questionsWithoutAnswers}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Avg Answers per Question:</span>
                          <span className="ml-2 font-semibold">{roundProgressData.roundStats.averageAnswersPerQuestion}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Generated:</span>
                          <span className="ml-2 font-semibold">{new Date(roundProgressData.generatedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Progress */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold">Question Progress</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Question</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Total Answers</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Unique Users</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Avg Response Time</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Answer Distribution</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roundProgressData.questionProgress.map((question, index) => (
                              <tr key={question.questionId} className="border-b border-gray-100">
                                <td className="px-4 py-3">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{index + 1}. {question.questionText}</div>
                                    <div className="text-gray-500">ID: {question.questionId}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-semibold text-blue-600">{question.totalAnswers}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-semibold text-green-600">{question.uniqueUsersAnswered}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-gray-700">{question.averageResponseTime ? `${(question.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="text-xs">
                                    {Object.entries(question.answerDistribution).map(([option, count]) => (
                                      <div key={option} className="text-gray-600">
                                        Option {String.fromCharCode(65 + parseInt(option))}: {count}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* User Progress */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold">User Progress</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Questions Answered</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Completion</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Avg Response Time</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Last Answered</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roundProgressData.userProgress.map((user) => (
                              <tr key={user.userId} className="border-b border-gray-100">
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">{user.displayName}</div>
                                    <div className="text-sm text-gray-500">#{user.uniqueId}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-semibold text-blue-600">{user.questionsAnswered}/{user.totalQuestions}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full" 
                                        style={{ width: `${user.completionPercentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">{user.completionPercentage}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-gray-700">{user.averageResponseTime ? `${(user.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-sm text-gray-600">
                                    {user.lastAnsweredAt ? new Date(user.lastAnsweredAt).toLocaleTimeString() : 'Never'}
                                  </span>
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data</h3>
                    <p className="text-gray-600 mb-4">
                      Select a round and click &quot;Load Progress&quot; to view detailed progress information.
                    </p>
                    <p className="text-sm text-gray-500">
                      This will show you which questions have been answered and by whom.
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