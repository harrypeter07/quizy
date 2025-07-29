const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function testCurrentQuiz() {
  console.log('=== TESTING CURRENT QUIZ ===');
  
  try {
    // 1. Get the most recent quiz
    console.log('\n1. Fetching most recent quiz...');
    const recentResponse = await fetch(`${BASE_URL}/api/quiz/recent`);
    if (!recentResponse.ok) {
      throw new Error(`Failed to fetch recent quiz: ${recentResponse.status}`);
    }
    const recentQuiz = await recentResponse.json();
    console.log('Recent quiz:', {
      quizId: recentQuiz.quizId,
      name: recentQuiz.name,
      active: recentQuiz.active,
      currentRound: recentQuiz.currentRound
    });

    // 2. Test quiz status
    console.log('\n2. Testing quiz status...');
    const statusResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/round-status`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('Quiz status:', status);
    }

    // 3. Test user count (if admin token is available)
    if (ADMIN_TOKEN !== 'your-admin-token-here') {
      console.log('\n3. Testing user count...');
      const userCountResponse = await fetch(`${BASE_URL}/api/admin/quiz/${recentQuiz.quizId}/user-count`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (userCountResponse.ok) {
        const userCount = await userCountResponse.json();
        console.log('User count:', {
          totalUsers: userCount.totalUsers,
          activeUsers: userCount.activeUsers,
          waitingUsers: userCount.waitingUsers
        });
      }
    }

    // 4. Test quiz questions
    console.log('\n4. Testing quiz questions...');
    const questionsResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/questions`);
    if (questionsResponse.ok) {
      const questions = await questionsResponse.json();
      console.log(`Found ${questions.length} questions`);
      if (questions.length > 0) {
        console.log('Sample question:', {
          id: questions[0].id,
          text: questions[0].text.substring(0, 50) + '...',
          options: questions[0].options.length
        });
      }
    }

    // 5. Test submission endpoint (with sample data)
    console.log('\n5. Testing submission endpoint...');
    const sampleSubmission = {
      userId: 'test-user-123',
      quizId: recentQuiz.quizId,
      questionId: 'q_test_1',
      selectedOption: 'Option A - Sample answer',
      questionStartTimestamp: Date.now() - 30000, // 30 seconds ago
      responseTimeMs: 25000,
      round: 1
    };

    const submitResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleSubmission)
    });

    if (submitResponse.ok) {
      const submitResult = await submitResponse.json();
      console.log('Submission test result:', submitResult);
    } else {
      const errorData = await submitResponse.json();
      console.log('Submission test failed:', errorData);
    }

    console.log('\n=== TEST COMPLETED ===');
    console.log('Current active quiz ID:', recentQuiz.quizId);
    console.log('Use this quiz ID for testing submissions');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCurrentQuiz(); 