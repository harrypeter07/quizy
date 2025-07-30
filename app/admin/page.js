"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [questionResponses, setQuestionResponses] = useState(null);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [showButtonGuide, setShowButtonGuide] = useState(false);
  const [manuallySelectedQuiz, setManuallySelectedQuiz] = useState(false);
  const [showJsonUpload, setShowJsonUpload] = useState(false);
  const [jsonUploadData, setJsonUploadData] = useState('');
  const [jsonUploadLoading, setJsonUploadLoading] = useState(false);
  const [customQuestionSets, setCustomQuestionSets] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareTableRef = useRef(null);

  // Calculate isQuizActive early to avoid initialization errors
  const isQuizActive = dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.active;
  const isQuizDeactivated = dashboardData?.quizStats.find(q => q.id === selectedQuiz)?.deactivated;

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

  // Auto-select the most recent quiz only on initial load or if no quiz is selected
  useEffect(() => {
    if (dashboardData && dashboardData.quizStats && dashboardData.quizStats.length > 0) {
      // Only auto-select if no quiz is currently selected and no manual selection has been made
      if (!selectedQuiz && !manuallySelectedQuiz) {
        const latestQuiz = dashboardData.quizStats.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
        setSelectedQuiz(latestQuiz.id);
      }
    }
  }, [dashboardData, selectedQuiz, manuallySelectedQuiz]);

  useEffect(() => {
    if (selectedQuiz && isAuthenticated) {
      // Call functions directly to avoid dependency issues
      const loadData = async () => {
        try {
          // Fetch dashboard data
          const res = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDashboardData(data);
          }
          
          // Fetch user count
          const userRes = await fetch(`/api/quiz/${selectedQuiz}/user-count`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserCountData(userData);
          } else {
            setUserCountData({ totalUsers: 0, waitingUsers: 0, activeUsers: 0, recentUsers: 0 });
          }
          
          // Fetch current quiz info
          fetchCurrentQuizInfo(selectedQuiz);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      
      loadData();
    }
  }, [selectedQuiz, isAuthenticated, adminToken]); // Removed function dependencies

  // Auto refresh user count every 10 seconds (reduced frequency)
  useEffect(() => {
    if (!isAuthenticated || !selectedQuiz) return;
    
    const interval = setInterval(async () => {
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
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedQuiz]); // Removed fetchUserCount dependency

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

  // Auto-load question responses when tab changes
  useEffect(() => {
    if (activeTab === 'responses' && selectedQuiz && adminToken) {
      const loadQuestionResponses = async () => {
        setResponsesLoading(true);
        try {
          const res = await fetch(`/api/admin/quiz/${selectedQuiz}/question-responses`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setQuestionResponses(data);
          } else {
            setQuestionResponses(null);
          }
        } catch (error) {
          setQuestionResponses(null);
        } finally {
          setResponsesLoading(false);
        }
      };
      loadQuestionResponses();
    }
  }, [activeTab, selectedQuiz, adminToken]);

  // Fetch custom question sets on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomQuestionSets();
    }
  }, [isAuthenticated]);

  // Update available question sets when custom sets change
  useEffect(() => {
    if (customQuestionSets.length > 0) {
      fetchAvailableQuestionSets();
    }
  }, [customQuestionSets]);

  // Auto-refresh responses every 10 seconds when on responses tab and quiz is active
  useEffect(() => {
    if (activeTab === 'responses' && selectedQuiz && adminToken && isQuizActive) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/quiz/${selectedQuiz}/question-responses`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setQuestionResponses(data);
          }
        } catch (error) {
          console.error('Error refreshing responses:', error);
        }
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedQuiz, adminToken, isQuizActive]);

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
    // Add confirmation for restart action
    if (action === 'restart') {
      const confirmed = window.confirm(
        '⚠️ WARNING: This will restart the quiz from the first question!\n\n' +
        '• All participants will be reset to question 1\n' +
        '• All current answers will be cleared\n' +
        '• Leaderboard will be reset\n\n' +
        'Are you sure you want to restart the quiz?'
      );
      if (!confirmed) {
        return;
      }
    }

    // Add confirmation for deactivate action
    if (action === 'deactivate') {
      const confirmed = window.confirm(
        '⚠️ WARNING: This will permanently deactivate the quiz!\n\n' +
        '• The quiz will be permanently disabled\n' +
        '• It cannot be started again\n' +
        '• All data will be preserved but the quiz will be inactive\n\n' +
        'Are you sure you want to deactivate the quiz?'
      );
      if (!confirmed) {
        return;
      }
    }

    // Add confirmation for reactivate action
    if (action === 'reactivate') {
      const confirmed = window.confirm(
        '✅ REACTIVATE QUIZ\n\n' +
        '• The quiz will be reactivated and can be used again\n' +
        '• All existing data will be preserved\n' +
        '• The quiz will be available for starting\n\n' +
        'Are you sure you want to reactivate this quiz?'
      );
      if (!confirmed) {
        return;
      }
    }

    // Add confirmation for delete action
    if (action === 'delete') {
      const confirmed = window.confirm(
        '🗑️ PERMANENTLY DELETE QUIZ\n\n' +
        '⚠️ WARNING: This action cannot be undone!\n\n' +
        '• The quiz will be permanently deleted\n' +
        '• All quiz data will be lost\n' +
        '• All user answers will be deleted\n' +
        '• All leaderboard entries will be removed\n' +
        '• User progress will be cleared\n\n' +
        'Are you absolutely sure you want to delete this quiz?'
      );
      if (!confirmed) {
        return;
      }
    }
    
    setLoading(true);
    setStatus(`${action} quiz...`);
    
    try {
      let endpoint;
      let method = 'POST';
      if (action === 'start') endpoint = 'start';
      else if (action === 'stop') endpoint = 'stop';
      else if (action === 'restart') endpoint = 'restart';
      else if (action === 'deactivate') endpoint = 'deactivate';
      else if (action === 'reactivate') endpoint = 'reactivate';
      else if (action === 'delete') {
        endpoint = 'delete';
        method = 'DELETE';
      }
      else {
        setStatus('Invalid action');
        return;
      }
      
      const res = await fetch(`/api/admin/quiz/${quizId}/${endpoint}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (action === 'restart') {
          setStatus(`Quiz restarted successfully! Cleared ${data.clearedAnswers} answers, ${data.clearedLeaderboard} leaderboard entries`);
        } else if (action === 'deactivate') {
          setStatus('Quiz deactivated successfully! The quiz is now permanently disabled.');
        } else if (action === 'reactivate') {
          setStatus('Quiz reactivated successfully! The quiz can now be used again.');
        } else if (action === 'delete') {
          const stats = data.stats;
          setStatus(`Quiz deleted successfully! Removed ${stats.answersDeleted} answers, ${stats.leaderboardDeleted} leaderboard entries, and cleared progress for ${stats.usersUpdated} users.`);
          // If we deleted the currently selected quiz, clear the selection
          if (selectedQuiz === quizId) {
            setSelectedQuiz('');
            setCurrentQuizInfo(null);
          }
        } else {
          setStatus(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
        }
        
        // If starting a quiz, switch to quizzes tab and set as selected quiz
        if (action === 'start') {
          setSelectedQuiz(quizId);
          setManuallySelectedQuiz(true);
          setActiveTab('quizzes');
          // Fetch current quiz info to update the display
          await fetchCurrentQuizInfo(quizId);
          setStatus(`Quiz started successfully! Switched to Quizzes tab for full control.`);
        }
        
        await fetchDashboardData(adminToken); // Refresh data
      } else {
        const errorData = await res.json();
        setStatus(`${action.charAt(0).toUpperCase() + action.slice(1)} failed: ${errorData.error}`);
      }
    } catch (error) {
      setStatus(`Error ${action}ing quiz`);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setStatus('Calculating results and stopping quiz...');
    
    try {
      const res = await fetch(`/api/admin/quiz/${selectedQuiz}/evaluate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.quizStopped) {
          setStatus(`✅ Results calculated successfully! Quiz automatically stopped. ${data.totalEvaluated} participants evaluated.`);
        } else {
          setStatus(`✅ Results calculated successfully! ${data.totalEvaluated} participants evaluated.`);
        }
        
        // Refresh data directly instead of using useCallback functions
        try {
          // Refresh dashboard data
          const dashboardRes = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (dashboardRes.ok) {
            const dashboardData = await dashboardRes.json();
            setDashboardData(dashboardData);
          }
          
          // Refresh user count
          const userRes = await fetch(`/api/quiz/${selectedQuiz}/user-count`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserCountData(userData);
          }
        } catch (refreshError) {
          console.error('Error refreshing data after evaluation:', refreshError);
        }
      } else {
        const errorData = await res.json();
        setStatus(`Evaluation failed: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error calculating results');
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
      let selectedSet = availableQuestionSets.find(set => set.key === selectedQuestionSet);
      
      // If it's a custom question set, fetch it from the database
      if (selectedQuestionSet.startsWith('custom_')) {
        try {
          const res = await fetch('/api/admin/quiz/upload-questions', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            const customSet = data.questionSets.find(set => set.key === selectedQuestionSet);
            if (customSet) {
              selectedSet = {
                key: customSet.key,
                name: customSet.name,
                questions: customSet.questions
              };
            }
          }
        } catch (error) {
          console.error('Error fetching custom question set:', error);
          setStatus('Error fetching custom question set');
          setLoading(false);
          return;
        }
      }
      
      if (!selectedSet) {
        setStatus('Selected question set not found');
        setLoading(false);
        return;
      }
      
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
          setManuallySelectedQuiz(true);
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

  const fetchCurrentQuizInfo = async (quizId = null) => {
    try {
      let endpoint = '/api/quiz/recent';
      if (quizId) {
        endpoint = `/api/quiz/${quizId}/quiz-info`;
      }
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setCurrentQuizInfo(data);
        // Set the selected quiz to the quiz ID
        setSelectedQuiz(data.quizId || quizId);
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
    setStatus('Calculating user scores and stopping quiz...');
    
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
        const { validationReport, leaderboard, stats, totalEvaluated, quizStopped } = data;
        
        if (validationReport.issues.length === 0) {
          setStatus(`✅ Scores calculated successfully! ${totalEvaluated || validationReport.evaluation?.totalParticipants || 0} participants processed. Quiz automatically stopped.`);
        } else {
          const issueCount = validationReport.issues.reduce((sum, issue) => sum + issue.count, 0);
          setStatus(`✅ Scores calculated! ${totalEvaluated || validationReport.evaluation?.totalParticipants || 0} participants processed. Found ${issueCount} data issues. Quiz automatically stopped.`);
          // console.log('Data validation issues:', validationReport.issues);
        }
        
        // Refresh dashboard data to reflect quiz stopping
        await fetchDashboardData(adminToken);
        await fetchUserCount();
        
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

  const handleJsonUpload = async () => {
    if (!jsonUploadData.trim()) {
      setStatus('❌ Please enter JSON data');
      return;
    }

    setJsonUploadLoading(true);
    setStatus('🔍 Validating JSON format...');

    try {
      // Parse and validate JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonUploadData);
        setStatus('✅ JSON format valid. Validating question structure...');
      } catch (parseError) {
        setStatus('❌ Invalid JSON format. Please check your JSON syntax.');
        setJsonUploadLoading(false);
        return;
      }

      // Basic validation before sending to server
      if (!parsedData.name || !parsedData.questions || !Array.isArray(parsedData.questions)) {
        setStatus('❌ Invalid question set format. Missing required fields (name, questions).');
        setJsonUploadLoading(false);
        return;
      }

      if (parsedData.questions.length === 0) {
        setStatus('❌ Question set must contain at least one question.');
        setJsonUploadLoading(false);
        return;
      }

      setStatus('📤 Uploading question set to server...');
      
      const res = await fetch('/api/admin/quiz/upload-questions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionSet: parsedData })
      });

      if (res.ok) {
        const data = await res.json();
        setStatus(`✅ ${data.message} 🎉`);
        setJsonUploadData('');
        setShowJsonUpload(false);
        
        // Set upload success details
        setUploadSuccess({
          name: parsedData.name,
          questionCount: parsedData.questions.length,
          message: data.message,
          details: data.details
        });
        
        // Refresh custom question sets
        setStatus('🔄 Updating question set list...');
        await fetchCustomQuestionSets();
        
        // Update available question sets
        await fetchAvailableQuestionSets();
        
        // Show final success message
        setTimeout(() => {
          setStatus(`✅ Question set "${parsedData.name}" uploaded successfully! You can now use it when creating quizzes.`);
          // Clear success notification after 5 seconds
          setTimeout(() => setUploadSuccess(null), 5000);
        }, 1000);
        
      } else {
        const errorData = await res.json();
        let errorMessage = `❌ Upload failed: ${errorData.error}`;
        
        if (errorData.details) {
          console.error('Validation details:', errorData.details);
          if (Array.isArray(errorData.details)) {
            const detailMessages = errorData.details.map(detail => 
              `• ${detail.path?.join('.') || 'unknown'}: ${detail.message}`
            ).join('\n');
            errorMessage += `\n\nValidation errors:\n${detailMessages}`;
          }
        }
        
        setStatus(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('❌ Network error. Please check your connection and try again.');
    } finally {
      setJsonUploadLoading(false);
    }
  };

  const loadSampleJson = () => {
    const sampleJson = {
      "name": "Sample Quiz",
      "questions": [
        {
          "id": "q1",
          "text": "What is the capital of France?",
          "options": ["London", "Berlin", "Paris", "Madrid"],
          "correctAnswers": [
            {"option": 2, "points": 100}
          ]
        },
        {
          "id": "q2",
          "text": "Which planet is closest to the Sun?",
          "options": ["Venus", "Mercury", "Earth", "Mars"],
          "correctAnswers": [
            {"option": 1, "points": 100}
          ]
        },
        {
          "id": "q3",
          "text": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"],
          "correctAnswers": [
            {"option": 1, "points": 50},
            {"option": 2, "points": 25}
          ]
        }
      ]
    };
    setJsonUploadData(JSON.stringify(sampleJson, null, 2));
  };

  const fetchCustomQuestionSets = async () => {
    try {
      const res = await fetch('/api/admin/quiz/upload-questions', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomQuestionSets(data.questionSets || []);
      }
    } catch (error) {
      console.error('Error fetching custom question sets:', error);
    }
  };

  const fetchAvailableQuestionSets = async () => {
    try {
      // Get the original built-in question sets
      const { questionSets: builtInSets } = await import('../../lib/questionSets');
      
      // Combine built-in and custom question sets
      const customSets = customQuestionSets.map(set => ({
        key: set.key,
        name: `${set.name} (Custom)`,
        questions: set.questions
      }));
      
      const allSets = [...builtInSets, ...customSets];
      setAvailableQuestionSets(allSets);
    } catch (error) {
      console.error('Error updating available question sets:', error);
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Current Quiz Display */}
        {currentQuizInfo && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg">
            <div className="flex flex-col gap-3">
              {/* Quiz Info Row */}
              
              {/* Button Explanation */}
              <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-blue-100">📋 Admin Controls Guide</h4>
                  <button
                    onClick={() => setShowButtonGuide(!showButtonGuide)}
                    className="text-blue-200 hover:text-blue-100 text-sm"
                  >
                    {showButtonGuide ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                {showButtonGuide && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-yellow-500/20 rounded p-2 border border-yellow-400/30">
                      <div className="font-medium text-yellow-100 mb-1">📊 Evaluate Button</div>
                      <div className="text-yellow-200 text-xs">
                        • Final evaluation and scoring<br/>
                        • Creates official leaderboard<br/>
                        • Stops quiz automatically<br/>
                        • Use after quiz completion
                      </div>
                    </div>
                    <div className="bg-orange-500/20 rounded p-2 border border-orange-400/30">
                      <div className="font-medium text-orange-100 mb-1">🔍 Validate Button</div>
                      <div className="text-orange-200 text-xs">
                        • Data validation and scoring<br/>
                        • Updates leaderboard<br/>
                        • Stops quiz automatically<br/>
                        • Use during or after quiz
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold truncate">{currentQuizInfo.name || 'Loading...'}</h1>
                {isRefreshing && (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    <span className="text-xs text-blue-100">Refreshing...</span>
                  </div>
                )}
              </div>
              
              {/* Quiz Details Row */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 text-blue-100 text-xs sm:text-sm">
                <span className="flex items-center">
                  <span className="mr-1">📝</span>
                  {currentQuizInfo.questionCount} Questions
                </span>
                <span className="flex items-center">
                  <span className="mr-1">🎯</span>
                  <span className="truncate">ID: {selectedQuiz}</span>
                </span>
                <span className="flex items-center">
                  <span className="mr-1">📅</span>
                  <span className="truncate">
                    {currentQuizInfo.wasReactivated ? 'Reactivated' : 'Created'}: {currentQuizInfo.wasReactivated ? currentQuizInfo.formattedReactivatedAt : currentQuizInfo.formattedCreatedAt}
                  </span>
                </span>
              </div>
              
              {/* Quiz Status Row */}
              <div className="flex items-center gap-2">
                {isQuizDeactivated ? (
                  <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    ⚫ Quiz Deactivated
                  </span>
                ) : isQuizActive ? (
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    🟢 Quiz Started
                  </span>
                ) : (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    🔴 Quiz Stopped
                  </span>
                )}
              </div>
              
              {/* Quiz Controls Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2">
                <button
                  onClick={handleRefreshQuizDetails}
                  disabled={isRefreshing}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? '🔄' : '🔄 Refresh'}
                </button>
                <button
                  onClick={() => setShowCreateQuiz(!showCreateQuiz)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors"
                >
                  ➕ Create
                </button>
                <button
                  onClick={() => setShowJsonUpload(!showJsonUpload)}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors"
                >
                  📤 Upload JSON
                </button>
                <button
                  onClick={() => handleQuizAction('start')}
                  disabled={isQuizActive || isQuizDeactivated || loading}
                  className="px-2 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:text-gray-600 transition-colors"
                >
                  {isQuizDeactivated ? '🚫' : '🚀 Start'}
                </button>
                <button
                  onClick={() => handleQuizAction('restart')}
                  disabled={!isQuizActive || isQuizDeactivated || loading}
                  className="px-2 py-1.5 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 disabled:text-gray-600 transition-colors"
                >
                  🔄 Restart
                </button>
                <button
                  onClick={() => handleQuizAction('stop')}
                  disabled={!isQuizActive || isQuizDeactivated || loading}
                  className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    !isQuizActive || isQuizDeactivated
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isQuizDeactivated ? '🚫' : !isQuizActive ? '⏹️' : '⏹️ Stop'}
                </button>
                <button
                  onClick={() => handleQuizAction('deactivate')}
                  disabled={isQuizDeactivated || loading}
                  className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    isQuizDeactivated
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-800 text-white'
                  } disabled:opacity-50`}
                >
                  {isQuizDeactivated ? '🚫' : '🚫 Deactivate'}
                </button>
                <button
                  onClick={() => handleQuizAction('reactivate')}
                  disabled={!isQuizDeactivated || loading}
                  className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    !isQuizDeactivated
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50`}
                >
                  {!isQuizDeactivated ? '✅' : '✅ Reactivate'}
                </button>
                <button
                  onClick={handleEvaluate}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  title="📊 Evaluate: Final scoring and leaderboard creation. Use after quiz completion for official results."
                >
                  📊 Evaluate
                </button>
                <button
                  onClick={handleValidateData}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  title="🔍 Validate: Data validation, score calculation, and quiz stopping. Use during or after quiz for results."
                >
                  🔍 Validate
                </button>
                <button
                  onClick={() => handleQuizAction('delete')}
                  disabled={loading}
                  className="bg-red-700 hover:bg-red-800 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              </div>

              {/* Responses Data Section */}
              {dashboardData?.quizStats && selectedQuiz && (() => {
                const quiz = dashboardData.quizStats.find(q => q.id === selectedQuiz);
                if (!quiz) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-blue-400/30">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                      {/* User Stats */}
                      <div className="text-center bg-blue-500/20 rounded p-1">
                        <div className="font-bold text-blue-100">{quiz.userCount}</div>
                        <div className="text-blue-200">Users</div>
                      </div>
                      <div className="text-center bg-green-500/20 rounded p-1">
                        <div className="font-bold text-green-100">{quiz.answerCount}</div>
                        <div className="text-green-200">Answers</div>
                      </div>
                      <div className="text-center bg-purple-500/20 rounded p-1">
                        <div className="font-bold text-purple-100">{quiz.leaderboard.length}</div>
                        <div className="text-purple-200">Scores</div>
                      </div>
                      <div className="text-center bg-yellow-500/20 rounded p-1">
                        <div className="font-bold text-yellow-100">
                          {quiz.answerCount > 0 && quiz.userCount > 0 ? Math.round(quiz.answerCount / quiz.userCount) : 0}
                        </div>
                        <div className="text-yellow-200">Avg/Q</div>
                      </div>
                      {/* Top 2 Leaderboard */}
                      {quiz.leaderboard.slice(0, 2).map((entry, index) => (
                        <div key={entry.userId} className="text-center bg-orange-500/20 rounded p-1">
                          <div className="font-bold text-orange-100 flex items-center justify-center gap-1">
                            {index === 0 ? '🥇' : '🥈'} {entry.score}
                          </div>
                          <div className="text-orange-200 text-xs truncate">
                            {entry.displayName}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => setActiveTab('responses')}
                        className="bg-blue-500/30 hover:bg-blue-500/50 text-blue-100 px-2 py-1 rounded text-xs font-semibold transition-colors"
                      >
                        📊 View Responses
                      </button>
                      <button
                        onClick={() => setActiveTab('leaderboard')}
                        className="bg-green-500/30 hover:bg-green-500/50 text-green-100 px-2 py-1 rounded text-xs font-semibold transition-colors"
                      >
                        🏆 View Leaderboard
                      </button>
                    </div>
                  </div>
                );
              })()}
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

        {/* Success Notification */}
        {uploadSuccess && (
          <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-900">
                  Upload Successful!
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  <p><strong>{uploadSuccess.name}</strong></p>
                  <p>{uploadSuccess.questionCount} questions uploaded</p>
                  {uploadSuccess.details?.warnings && uploadSuccess.details.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-yellow-600 font-medium">⚠️ Warnings:</p>
                      <ul className="text-xs text-yellow-700 list-disc list-inside">
                        {uploadSuccess.details.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setUploadSuccess(null)}
                className="ml-3 text-green-400 hover:text-green-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* JSON Upload Form - Show when uploading custom question set */}
        {showJsonUpload && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-900">📤 Upload Custom Question Set</h3>
              <button
                onClick={() => setShowJsonUpload(false)}
                className="text-green-600 hover:text-green-800 font-semibold"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-900 mb-1">
                  JSON Question Set
                  {jsonUploadData.trim() && (
                    <span className="ml-2 text-xs text-green-600">
                      ({jsonUploadData.length} characters)
                    </span>
                  )}
                </label>
                <textarea
                  value={jsonUploadData}
                  onChange={(e) => setJsonUploadData(e.target.value)}
                  className="w-full border border-green-300 rounded px-3 py-2 h-64 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`{
  "name": "My Custom Quiz",
  "questions": [
    {
      "id": "q1",
      "text": "What is your question?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswers": [
        {"option": 0, "points": 100},
        {"option": 1, "points": 50}
      ]
    }
  ]
}`}
                />
              </div>
              
              {/* Real-time validation feedback */}
              {jsonUploadData.trim() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-900 mb-2">🔍 Validation Status:</h4>
                  {(() => {
                    try {
                      const parsed = JSON.parse(jsonUploadData);
                      const hasName = parsed.name && typeof parsed.name === 'string';
                      const hasQuestions = parsed.questions && Array.isArray(parsed.questions);
                      const questionCount = hasQuestions ? parsed.questions.length : 0;
                      
                      return (
                        <div className="text-sm text-blue-800 space-y-1">
                          <div className={`flex items-center ${hasName ? 'text-green-600' : 'text-red-600'}`}>
                            {hasName ? '✅' : '❌'} Name: {hasName ? 'Valid' : 'Missing or invalid'}
                          </div>
                          <div className={`flex items-center ${hasQuestions ? 'text-green-600' : 'text-red-600'}`}>
                            {hasQuestions ? '✅' : '❌'} Questions array: {hasQuestions ? 'Valid' : 'Missing or invalid'}
                          </div>
                          <div className={`flex items-center ${questionCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {questionCount > 0 ? '✅' : '❌'} Question count: {questionCount} {questionCount === 0 ? '(at least 1 required)' : ''}
                          </div>
                          <div className="text-blue-600">
                            📝 JSON syntax: Valid
                          </div>
                        </div>
                      );
                    } catch (error) {
                      return (
                        <div className="text-sm text-red-600">
                          ❌ JSON syntax error: {error.message}
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
              
              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                <h4 className="font-semibold text-green-900 mb-2">📋 JSON Format Requirements:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>name:</strong> String - Name of your question set (required)</li>
                  <li>• <strong>questions:</strong> Array of question objects (1-100 questions)</li>
                  <li>• <strong>id:</strong> String - Unique question identifier (required)</li>
                  <li>• <strong>text:</strong> String - Question text (required)</li>
                  <li>• <strong>options:</strong> Array of 2-8 answer options (required)</li>
                  <li>• <strong>correctAnswers:</strong> Array of correct answers with points (required)</li>
                  <li>• <strong>option:</strong> Number (0-7) - Index of correct option</li>
                  <li>• <strong>points:</strong> Number (0+) - Points for this answer</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleJsonUpload}
                  disabled={jsonUploadLoading || !jsonUploadData.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {jsonUploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      📤 Upload Question Set
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setJsonUploadData('')}
                  disabled={jsonUploadLoading || !jsonUploadData.trim()}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
                
                <button
                  onClick={loadSampleJson}
                  disabled={jsonUploadLoading}
                  className="px-4 py-3 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-600"
                  title="Load sample JSON format"
                >
                  📋 Sample
                </button>
              </div>
              
              {/* Upload status */}
              {jsonUploadLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center text-blue-800">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Processing upload...
                  </div>
                </div>
              )}
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Total Users</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{dashboardData.overallStats.totalUsers}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Total Answers</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{dashboardData.overallStats.totalAnswers}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Active Quizzes</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{dashboardData.overallStats.activeQuizzes}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Deactivated Quizzes</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-600">{dashboardData.overallStats.deactivatedQuizzes || 0}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow col-span-2 lg:col-span-1">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Total Quizzes</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">{dashboardData.overallStats.totalQuizzes}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {['dashboard', 'quizzes', 'leaderboard', 'responses', 'progress', 'users'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap ${
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

          <div className="p-4 sm:p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Quiz Overview</h2>
                {dashboardData?.quizStats.map((quiz) => (
                  <div key={quiz.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold truncate">{quiz.name}</h3>
                        <p className="text-sm sm:text-base text-gray-600">{quiz.questionCount} questions</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                          quiz.deactivated ? 'bg-gray-600 text-white' : quiz.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {quiz.deactivated ? 'Deactivated' : quiz.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
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
                    {/* Quiz Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <button
                          onClick={() => handleQuizAction('start', quiz.id)}
                          disabled={quiz.active || quiz.deactivated || loading}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                            quiz.active || quiz.deactivated
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {quiz.deactivated ? '🚫 Deactivated' : quiz.active ? '✅ Started' : '🚀 Start'}
                        </button>
                        <button
                          onClick={() => handleQuizAction('stop', quiz.id)}
                          disabled={!quiz.active || quiz.deactivated || loading}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                            !quiz.active || quiz.deactivated
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {quiz.deactivated ? '🚫 Deactivated' : !quiz.active ? '⏹️ Stopped' : '⏹️ Stop'}
                        </button>
                        <button
                          onClick={() => handleQuizAction('deactivate', quiz.id)}
                          disabled={quiz.deactivated || loading}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                            quiz.deactivated
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-700 hover:bg-gray-800 text-white'
                          }`}
                        >
                          {quiz.deactivated ? '🚫 Already Deactivated' : '🚫 Deactivate'}
                        </button>
                        <button
                          onClick={() => handleQuizAction('reactivate', quiz.id)}
                          disabled={!quiz.deactivated || loading}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                            !quiz.deactivated
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {!quiz.deactivated ? '✅ Active' : '✅ Reactivate'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQuiz(quiz.id);
                            setManuallySelectedQuiz(true);
                            setActiveTab('quizzes');
                            setStatus(`Switched to ${quiz.name} for full control.`);
                          }}
                          className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          🎛️ Manage Quiz
                        </button>
                        <button
                          onClick={() => handleQuizAction('delete', quiz.id)}
                          disabled={loading}
                          className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium bg-red-700 hover:bg-red-800 text-white transition-colors disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="space-y-4 sm:space-y-6">
                {dashboardData?.quizStats && dashboardData.quizStats.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <label htmlFor="quiz-select" className="block text-sm sm:text-base font-semibold mb-2">Select Quiz:</label>
                        <select
                          id="quiz-select"
                          value={selectedQuiz}
                          onChange={e => {
                            setSelectedQuiz(e.target.value);
                            setManuallySelectedQuiz(true);
                            setStatus(`Switched to quiz: ${dashboardData.quizStats.find(q => q.id === e.target.value)?.name}`);
                          }}
                          className="w-full px-3 py-2 rounded border text-sm sm:text-base"
                        >
                          {dashboardData.quizStats.map(quiz => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.name} ({quiz.id}) - {quiz.active ? '🟢 Active' : quiz.deactivated ? '⚫ Deactivated' : '🔴 Inactive'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-sm sm:text-base text-gray-600">
                        Currently managing: <span className="font-semibold truncate">{dashboardData.quizStats.find(q => q.id === selectedQuiz)?.name || 'None'}</span>
                      </div>
                    </div>
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
                          <div><span className="text-gray-600">Status:</span> <span className={`font-semibold ${
                            quiz.deactivated ? 'text-gray-600' : quiz.active ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {quiz.deactivated ? '⚫ Deactivated' : quiz.active ? '🟢 Active' : '🔴 Inactive'}
                          </span></div>
                        </div>
                      </div>
                    );
                  })()
                )}




                {/* Current Round Information */}
                {/* Removed roundProgress and round-related UI */}

                {/* Quiz Status Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-700">
                      <span className="font-semibold">Quiz Status:</span> {isQuizDeactivated ? '⚫ Deactivated' : isQuizActive ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                    <div className="text-xs text-blue-600">
                      Use controls in the header above
                    </div>
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
                    {leaderboardData && leaderboardData.entries && leaderboardData.entries.length > 0 && (
                      <button
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-indigo-600 transition"
                        onClick={() => setShowShareModal(true)}
                      >
                        Share Leaderboard
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
                        onChange={(e) => {
                          // console.log('Leaderboard quiz selection:', e.target.value);
                          setSelectedQuiz(e.target.value);
                        }}
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
                        <table className="w-full" ref={shareTableRef}>
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Participant</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Score</th>
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
                                    <span className={`font-semibold ${index < 3 ? 'text-yellow-600' : 'text-gray-900'}`}>#{entry.rank}</span>
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
                                  <span className="text-gray-700">{entry.correctAnswers}/{entry.totalQuestions}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Share Leaderboard Modal */}
                    {showShareModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full relative">
                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setShowShareModal(false)}
                            aria-label="Close"
                          >
                            &times;
                          </button>
                          <h2 className="text-xl font-bold mb-4 text-center">Top {leaderboardData.actualCount} Leaderboard</h2>
                          <div className="overflow-x-auto mb-4">
                            <table className="w-full border">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-2 py-1 text-xs">Rank</th>
                                  <th className="px-2 py-1 text-xs">Name</th>
                                  <th className="px-2 py-1 text-xs">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaderboardData.entries.map((entry, idx) => (
                                  <tr key={entry.userId}>
                                    <td className="px-2 py-1 text-center">{entry.rank}</td>
                                    <td className="px-2 py-1">{entry.displayName} <span className="text-gray-400 text-xs">#{entry.uniqueId}</span></td>
                                    <td className="px-2 py-1 text-center">{entry.score}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="text-center">
                            <button
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-indigo-600 transition"
                              onClick={() => {
                                if (shareTableRef.current) {
                                  const range = document.createRange();
                                  range.selectNode(shareTableRef.current);
                                  window.getSelection().removeAllRanges();
                                  window.getSelection().addRange(range);
                                  document.execCommand('copy');
                                  window.getSelection().removeAllRanges();
                                  alert('Leaderboard copied to clipboard!');
                                }
                              }}
                            >
                              Copy Table
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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

            {activeTab === 'responses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Question Response Analysis</h2>
                  <button
                    onClick={async () => {
                      setResponsesLoading(true);
                      try {
                        const res = await fetch(`/api/admin/quiz/${selectedQuiz}/question-responses`, {
                          headers: { 'Authorization': `Bearer ${adminToken}` }
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setQuestionResponses(data);
                        }
                      } catch (error) {
                        console.error('Error loading responses:', error);
                      } finally {
                        setResponsesLoading(false);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={responsesLoading}
                  >
                    {responsesLoading ? 'Loading...' : 'Refresh Responses'}
                  </button>
                </div>

                {questionResponses ? (
                  <div className="space-y-6">
                    {/* Debug Info - Only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">🔧 Debug Information</h3>
                        <div className="text-sm text-gray-700">
                          <p>Quiz ID: {selectedQuiz}</p>
                          <p>Questions: {questionResponses.questionResponses?.length || 0}</p>
                          <p>Last Updated: {new Date(questionResponses.lastUpdated).toLocaleString()}</p>
                          <p>Data Structure: {JSON.stringify(Object.keys(questionResponses), null, 2)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overall Statistics */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Overall Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{questionResponses.overallStats?.totalAnswers || 0}</div>
                          <div className="text-sm text-blue-700">Total Answers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{questionResponses.overallStats?.activeUsers || 0}</div>
                          <div className="text-sm text-green-700">Active Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{questionResponses.overallStats?.averageResponsesPerQuestion || 0}</div>
                          <div className="text-sm text-purple-700">Avg Responses/Q</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{questionResponses.overallStats?.completionRate || 0}%</div>
                          <div className="text-sm text-orange-700">Completion Rate</div>
                        </div>
                      </div>
                    </div>

                    {/* Question-by-Question Analysis */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Question Response Details</h3>
                      {questionResponses.questionResponses.map((question, index) => (
                        <div key={question.questionId} className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">Question {question.questionNumber}</h4>
                              <p className="text-sm text-gray-600 mt-1">{question.questionText}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{question.totalResponses}</div>
                              <div className="text-xs text-gray-500">responses</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Option Distribution</h5>
                              <div className="space-y-2">
                                {Object.entries(question.optionCounts).map(([optionIndex, count]) => (
                                  <div key={optionIndex} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Option {parseInt(optionIndex) + 1}:</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-500 h-2 rounded-full" 
                                          style={{ width: `${question.totalResponses > 0 ? (count / question.totalResponses * 100) : 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">{count}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Performance Metrics</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Response Rate:</span>
                                  <span className="font-medium">{question.responseRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Avg Response Time:</span>
                                  <span className="font-medium">{question.averageResponseTime}s</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Response Data</h3>
                    <p className="text-gray-600 mb-4">
                      No response data available. Make sure the quiz is active and users are answering questions.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                      <h4 className="font-semibold text-yellow-800 mb-2">💡 Troubleshooting Tips:</h4>
                      <ul className="text-sm text-yellow-700 text-left space-y-1">
                        <li>• Ensure the quiz is started and active</li>
                        <li>• Check if users are connected and answering</li>
                        <li>• Verify the selected quiz has questions</li>
                        <li>• Try refreshing the responses data</li>
                      </ul>
                    </div>
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