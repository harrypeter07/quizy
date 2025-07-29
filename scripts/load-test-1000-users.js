const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
const QUIZ_ID = 'quiz_1753754879515_vzcixae63'; // Current active quiz
const CONCURRENT_USERS = 1000;
const TEST_DURATION = 30000; // 30 seconds

// Sample question data
const sampleQuestions = [
  {
    id: 'q_test_1',
    selectedOption: 'Option A - Sample answer',
    responseTimeMs: 25000
  },
  {
    id: 'q_test_2', 
    selectedOption: 'Option B - Sample answer',
    responseTimeMs: 30000
  },
  {
    id: 'q_test_3',
    selectedOption: 'Option C - Sample answer', 
    responseTimeMs: 20000
  }
];

async function simulateUser(userId) {
  const startTime = Date.now();
  const userResults = {
    userId,
    submissions: 0,
    errors: 0,
    totalTime: 0,
    successRate: 0
  };

  try {
    // Simulate user submitting answers
    for (let i = 0; i < sampleQuestions.length; i++) {
      const question = sampleQuestions[i];
      const submission = {
        userId: `user_${userId}`,
        quizId: QUIZ_ID,
        questionId: question.id,
        selectedOption: question.selectedOption,
        questionStartTimestamp: startTime - (sampleQuestions.length - i) * 5000,
        responseTimeMs: question.responseTimeMs,
        round: 1
      };

      try {
        const response = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        });

        if (response.ok) {
          userResults.submissions++;
        } else {
          userResults.errors++;
        }
      } catch (error) {
        userResults.errors++;
      }
    }

    userResults.totalTime = Date.now() - startTime;
    userResults.successRate = (userResults.submissions / (userResults.submissions + userResults.errors)) * 100;
    
    return userResults;
  } catch (error) {
    userResults.errors++;
    userResults.totalTime = Date.now() - startTime;
    return userResults;
  }
}

async function runLoadTest() {
  console.log('=== LOAD TEST: 1000+ CONCURRENT USERS ===');
  console.log(`Target: ${CONCURRENT_USERS} concurrent users`);
  console.log(`Duration: ${TEST_DURATION / 1000} seconds`);
  console.log(`Quiz ID: ${QUIZ_ID}`);
  console.log('Starting load test...\n');

  const startTime = Date.now();
  const results = [];
  const activeUsers = new Set();

  // Create concurrent user simulations
  const userPromises = [];
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const userId = i + 1;
    activeUsers.add(userId);
    
    const userPromise = simulateUser(userId).then(result => {
      activeUsers.delete(userId);
      return result;
    });
    
    userPromises.push(userPromise);
  }

  // Wait for all users to complete or timeout
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      console.log('Test timeout reached');
      resolve();
    }, TEST_DURATION);
  });

  try {
    const userResults = await Promise.race([
      Promise.all(userPromises),
      timeoutPromise
    ]);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Calculate statistics
    const totalSubmissions = userResults.reduce((sum, r) => sum + r.submissions, 0);
    const totalErrors = userResults.reduce((sum, r) => sum + r.errors, 0);
    const avgResponseTime = userResults.reduce((sum, r) => sum + r.totalTime, 0) / userResults.length;
    const successRate = (totalSubmissions / (totalSubmissions + totalErrors)) * 100;

    console.log('\n=== LOAD TEST RESULTS ===');
    console.log(`Total Users: ${userResults.length}`);
    console.log(`Total Submissions: ${totalSubmissions}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`Total Test Time: ${totalTime}ms`);
    console.log(`Throughput: ${(totalSubmissions / (totalTime / 1000)).toFixed(2)} submissions/second`);

    if (successRate >= 95) {
      console.log('\n✅ SUCCESS: System can handle 1000+ concurrent users!');
    } else if (successRate >= 80) {
      console.log('\n⚠️  WARNING: System performance is acceptable but could be improved');
    } else {
      console.log('\n❌ FAILURE: System cannot handle high concurrency');
    }

  } catch (error) {
    console.error('Load test failed:', error);
  }
}

// Run the load test
runLoadTest(); 