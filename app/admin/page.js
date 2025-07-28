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

  useEffect(() => {
    // Check if token is stored in localStorage
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setAdminToken(storedToken);
      setIsAuthenticated(true);
      fetchDashboardData(storedToken);
    }
  }, []);

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
        setStatus(`${action} successful!`);
        await fetchDashboardData(adminToken); // Refresh data
      } else {
        setStatus(`${action} failed`);
      }
    } catch (error) {
      setStatus(`Error ${action}ing quiz`);
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
              {['dashboard', 'quizzes', 'users'].map((tab) => (
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
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="space-y-6">
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleQuizAction('start')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Start Quiz
                  </button>
                  <button
                    onClick={() => handleQuizAction('stop')}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Stop Quiz
                  </button>
                  <button
                    onClick={() => handleQuizAction('evaluate')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Evaluate Quiz
                  </button>
                </div>

                {dashboardData && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Selected Quiz: {dashboardData.quizStats.find(q => q.id === selectedQuiz)?.name}</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-semibold mb-2">Questions:</h4>
                      <div className="space-y-2">
                        {dashboardData.quizStats.find(q => q.id === selectedQuiz)?.questions.map((q, idx) => (
                          <div key={q.id} className="text-sm">
                            <span className="font-medium">{idx + 1}.</span> {q.text}
                          </div>
                        ))}
                      </div>
                    </div>
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