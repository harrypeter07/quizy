const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class LoadTester {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      concurrentUsers: options.concurrentUsers || 100,
      testDuration: options.testDuration || 60000, // 1 minute
      delayBetweenRequests: options.delayBetweenRequests || 100, // 100ms
      quizId: options.quizId || 'default',
      ...options
    };
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      errors: []
    };
  }

  // Generate random user data
  generateUser() {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const userId = uuidv4();
    const uniqueId = Math.floor(Math.random() * 10000);
    
    return {
      userId,
      displayName: `${randomName}${uniqueId}`,
      uniqueId: uniqueId.toString()
    };
  }

  // Simulate user onboarding
  async onboardUser(user) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/users`, {
        userId: user.userId,
        displayName: user.displayName,
        uniqueId: user.uniqueId
      });
      return response.data;
    } catch (error) {
      console.error(`Onboarding failed for user ${user.userId}:`, error.message);
      return null;
    }
  }

  // Simulate user answering questions
  async simulateUserQuiz(user) {
    try {
      // Get questions
      const questionsResponse = await axios.get(`${this.baseUrl}/api/quiz/${this.options.quizId}/questions`);
      const questions = questionsResponse.data.questions;
      
      const answers = [];
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const startTime = Date.now();
        
        // Random delay to simulate thinking time
        await this.sleep(Math.random() * 5000 + 1000); // 1-6 seconds
        
        // Random answer selection
        const selectedOption = Math.floor(Math.random() * question.options.length).toString();
        
        const answerData = {
          userId: user.userId,
          quizId: this.options.quizId,
          questionId: question.id,
          selectedOption,
          questionStartTimestamp: startTime,
          responseTimeMs: Date.now() - startTime,
          round: Math.floor(i / 5) + 1 // 5 questions per round
        };
        
        try {
          const response = await axios.post(`${this.baseUrl}/api/quiz/${this.options.quizId}/submit`, answerData);
          answers.push({
            questionId: question.id,
            success: true,
            responseTime: Date.now() - startTime
          });
        } catch (error) {
          answers.push({
            questionId: question.id,
            success: false,
            error: error.message
          });
        }
        
        // Small delay between questions
        await this.sleep(200);
      }
      
      return answers;
    } catch (error) {
      console.error(`Quiz simulation failed for user ${user.userId}:`, error.message);
      return [];
    }
  }

  // Simulate a single user session
  async simulateUser(userId) {
    const user = this.generateUser();
    user.userId = userId; // Use provided userId for tracking
    
    console.log(`Starting simulation for user: ${user.displayName} (${user.userId})`);
    
    // Onboard user
    await this.onboardUser(user);
    
    // Simulate quiz participation
    const quizResults = await this.simulateUserQuiz(user);
    
    return {
      user,
      quizResults,
      successCount: quizResults.filter(r => r.success).length,
      totalQuestions: quizResults.length
    };
  }

  // Run load test
  async runLoadTest() {
    console.log(`🚀 Starting load test with ${this.options.concurrentUsers} concurrent users`);
    console.log(`📊 Test duration: ${this.options.testDuration / 1000} seconds`);
    console.log(`🎯 Target: ${this.baseUrl}`);
    console.log('=' * 50);
    
    const startTime = Date.now();
    const userPromises = [];
    
    // Create concurrent user simulations
    for (let i = 0; i < this.options.concurrentUsers; i++) {
      const userId = `loadtest-${i}-${Date.now()}`;
      const userPromise = this.simulateUser(userId);
      userPromises.push(userPromise);
      
      // Add delay between user creation to avoid overwhelming the server
      if (i < this.options.concurrentUsers - 1) {
        await this.sleep(this.options.delayBetweenRequests);
      }
    }
    
    // Wait for all users to complete
    const results = await Promise.allSettled(userPromises);
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // Process results
    const successfulUsers = results.filter(r => r.status === 'fulfilled').length;
    const failedUsers = results.filter(r => r.status === 'rejected').length;
    
    console.log('\n' + '=' * 50);
    console.log('📈 LOAD TEST RESULTS');
    console.log('=' * 50);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`👥 Total Users: ${this.options.concurrentUsers}`);
    console.log(`✅ Successful Users: ${successfulUsers}`);
    console.log(`❌ Failed Users: ${failedUsers}`);
    console.log(`📊 Success Rate: ${((successfulUsers / this.options.concurrentUsers) * 100).toFixed(2)}%`);
    
    // Calculate average response times
    const allResponseTimes = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.quizResults) {
        result.value.quizResults.forEach(answer => {
          if (answer.responseTime) {
            allResponseTimes.push(answer.responseTime);
          }
        });
      }
    });
    
    if (allResponseTimes.length > 0) {
      const avgResponseTime = allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
      console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`🚀 Min Response Time: ${Math.min(...allResponseTimes)}ms`);
      console.log(`🐌 Max Response Time: ${Math.max(...allResponseTimes)}ms`);
    }
    
    return {
      totalUsers: this.options.concurrentUsers,
      successfulUsers,
      failedUsers,
      successRate: (successfulUsers / this.options.concurrentUsers) * 100,
      totalDuration,
      averageResponseTime: allResponseTimes.length > 0 ? 
        allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length : 0
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';
  const concurrentUsers = parseInt(args[1]) || 100;
  const testDuration = parseInt(args[2]) || 60000;
  
  console.log(`🎯 Testing URL: ${baseUrl}`);
  console.log(`👥 Concurrent Users: ${concurrentUsers}`);
  console.log(`⏱️  Test Duration: ${testDuration}ms`);
  
  const loadTester = new LoadTester(baseUrl, {
    concurrentUsers,
    testDuration,
    delayBetweenRequests: 50 // Faster for load testing
  });
  
  loadTester.runLoadTest()
    .then(results => {
      console.log('\n✅ Load test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}

module.exports = LoadTester; 