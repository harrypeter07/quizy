#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Quick test configuration
const config = {
  baseUrl: process.argv[2] || 'http://localhost:3000',
  userCount: parseInt(process.argv[3]) || 10,
  quizId: process.argv[4] || 'default'
};

console.log('🚀 Quick Load Test');
console.log('=' * 40);
console.log(`URL: ${config.baseUrl}`);
console.log(`Users: ${config.userCount}`);
console.log(`Quiz: ${config.quizId}`);
console.log('=' * 40);

async function quickTest() {
  const startTime = Date.now();
  const results = {
    successful: 0,
    failed: 0,
    responseTimes: []
  };

  console.log('\n📊 Starting test...\n');

  // Test 1: Check if server is reachable
  try {
    console.log('🔍 Testing server connectivity...');
    const healthCheck = await axios.get(`${config.baseUrl}/api/test/load-test`);
    console.log('✅ Server is reachable');
  } catch (error) {
    console.log('❌ Server is not reachable');
    console.log('   Make sure your app is running and the URL is correct');
    process.exit(1);
  }

  // Test 2: Simulate users
  const userPromises = [];
  
  for (let i = 0; i < config.userCount; i++) {
    const userId = `quicktest-${i}-${Date.now()}`;
    const userPromise = simulateUser(userId);
    userPromises.push(userPromise);
    
    // Small delay to avoid overwhelming
    if (i < config.userCount - 1) {
      await sleep(50);
    }
  }

  // Wait for all users to complete
  const userResults = await Promise.allSettled(userPromises);
  
  // Process results
  userResults.forEach(result => {
    if (result.status === 'fulfilled') {
      results.successful++;
      if (result.value.responseTime) {
        results.responseTimes.push(result.value.responseTime);
      }
    } else {
      results.failed++;
    }
  });

  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // Calculate statistics
  const avgResponseTime = results.responseTimes.length > 0 
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
    : 0;
  
  const successRate = (results.successful / config.userCount) * 100;

  // Display results
  console.log('\n📈 QUICK TEST RESULTS');
  console.log('=' * 40);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`👥 Total Users: ${config.userCount}`);
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  if (results.responseTimes.length > 0) {
    console.log(`🚀 Min Response Time: ${Math.min(...results.responseTimes)}ms`);
    console.log(`🐌 Max Response Time: ${Math.max(...results.responseTimes)}ms`);
  }

  // Performance assessment
  console.log('\n🎯 PERFORMANCE ASSESSMENT');
  console.log('=' * 40);
  
  if (successRate >= 95) {
    console.log('🟢 EXCELLENT: Server handling load very well');
  } else if (successRate >= 80) {
    console.log('🟡 GOOD: Server handling load adequately');
  } else if (successRate >= 60) {
    console.log('🟠 FAIR: Server struggling with load');
  } else {
    console.log('🔴 POOR: Server not handling load well');
  }

  if (avgResponseTime < 1000) {
    console.log('⚡ FAST: Response times are excellent');
  } else if (avgResponseTime < 3000) {
    console.log('🐌 SLOW: Response times could be better');
  } else {
    console.log('🐌 VERY SLOW: Response times are concerning');
  }

  console.log('\n💡 RECOMMENDATIONS');
  console.log('=' * 40);
  
  if (successRate < 90) {
    console.log('• Reduce concurrent users');
    console.log('• Check database connection limits');
    console.log('• Monitor Vercel function logs');
  }
  
  if (avgResponseTime > 2000) {
    console.log('• Optimize database queries');
    console.log('• Check for cold start issues');
    console.log('• Consider function optimization');
  }
  
  if (successRate >= 90 && avgResponseTime < 1000) {
    console.log('• Ready for larger scale testing');
    console.log('• Consider testing with 100+ users');
    console.log('• Monitor during peak usage');
  }

  console.log('\n✅ Quick test completed!');
}

async function simulateUser(userId) {
  const user = {
    userId,
    displayName: `TestUser${Math.floor(Math.random() * 1000)}`,
    uniqueId: Math.floor(Math.random() * 10000).toString()
  };

  const startTime = Date.now();

  try {
    // Onboard user
    await axios.post(`${config.baseUrl}/api/users`, user);
    
    // Get questions
    const questionsResponse = await axios.get(`${config.baseUrl}/api/quiz/${config.quizId}/questions`);
    const questions = questionsResponse.data.questions;
    
    // Answer first 3 questions (quick test)
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const question = questions[i];
      const selectedOption = Math.floor(Math.random() * question.options.length).toString();
      
      await axios.post(`${config.baseUrl}/api/quiz/${config.quizId}/submit`, {
        userId: user.userId,
        quizId: config.quizId,
        questionId: question.id,
        selectedOption,
        questionStartTimestamp: Date.now(),
        responseTimeMs: 1000,
        round: Math.floor(i / 5) + 1
      });
      
      await sleep(100); // Small delay
    }
    
    return { responseTime: Date.now() - startTime };
  } catch (error) {
    throw new Error(`User simulation failed: ${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
quickTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }); 