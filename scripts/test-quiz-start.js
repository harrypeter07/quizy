const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function testQuizStart() {
  console.log('=== TESTING QUIZ START FUNCTIONALITY ===');
  
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

    // 2. Check current quiz status
    console.log('\n2. Checking current quiz status...');
    const statusResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/start-status`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('Quiz status:', status);
    }

    // 3. Check round status
    console.log('\n3. Checking round status...');
    const roundResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/round-status`);
    if (roundResponse.ok) {
      const roundStatus = await roundResponse.json();
      console.log('Round status:', roundStatus);
    }

    // 4. Test quiz start (if admin token is available)
    if (ADMIN_TOKEN !== 'your-admin-token-here') {
      console.log('\n4. Testing quiz start...');
      const startResponse = await fetch(`${BASE_URL}/api/admin/quiz/${recentQuiz.quizId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (startResponse.ok) {
        const startData = await startResponse.json();
        console.log('Quiz start result:', startData);
        
        // 5. Check status after start
        console.log('\n5. Checking status after start...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const newStatusResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/start-status`);
        if (newStatusResponse.ok) {
          const newStatus = await newStatusResponse.json();
          console.log('New quiz status:', newStatus);
          
          // Check for NaN values
          if (isNaN(newStatus.startedAt) || isNaN(newStatus.countdown)) {
            console.log('❌ ERROR: NaN values detected in status response');
          } else {
            console.log('✅ No NaN values detected');
          }
        }
        
        // 6. Check round status after start
        console.log('\n6. Checking round status after start...');
        const newRoundResponse = await fetch(`${BASE_URL}/api/quiz/${recentQuiz.quizId}/round-status`);
        if (newRoundResponse.ok) {
          const newRoundStatus = await newRoundResponse.json();
          console.log('New round status:', newRoundStatus);
        }
        
      } else {
        const errorData = await startResponse.json();
        console.log('Quiz start failed:', errorData);
      }
    }

    console.log('\n=== TEST COMPLETED ===');
    console.log('Current active quiz ID:', recentQuiz.quizId);

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testQuizStart(); 