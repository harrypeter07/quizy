#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Real API Test Configuration
const config = {
  baseUrl: process.argv[2] || 'http://localhost:3000',
  userCount: parseInt(process.argv[3]) || 100,
  quizId: process.argv[4] || 'default',
  round: parseInt(process.argv[5]) || 1,
  delayBetweenUsers: 50,
  delayBetweenQuestions: 200,
  thinkingTimeRange: { min: 1000, max: 3000 }
};

console.log('🚀 Real API Test (No Test Endpoints)');
console.log('=' * 50);
console.log(`URL: ${config.baseUrl}`);
console.log(`Users: ${config.userCount}`);
console.log(`Quiz: ${config.quizId}`);
console.log(`Round: ${config.round}`);
console.log('=' * 50);

class RealApiTester {
  constructor(config) {
    this.config = config;
    this.results = {
      totalUsers: 0,
      successfulUsers: 0,
      failedUsers: 0,
      totalAnswers: 0,
      successfulAnswers: 0,
      failedAnswers: 0,
      responseTimes: [],
      errors: [],
      startTime: Date.now(),
      endTime: null
    };
  }

  // Generate random user data
  generateUser(index) {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const userId = `real-test-${index}-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const uniqueId = Math.floor(Math.random() * 9000) + 1000; // Ensure 4 digits
    
    return {
      userId,
      displayName: `${randomName}${uniqueId}`,
      uniqueId: uniqueId.toString(),
      index
    };
  }

  // Check server connectivity using real API
  async checkServerConnectivity() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/quiz-info`);
      return response.data;
    } catch (error) {
      console.error('❌ Server connectivity check failed:', error.message);
      return null;
    }
  }

  // Simulate user onboarding using real API
  async onboardUser(user) {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/users`, {
        userId: user.userId,
        displayName: user.displayName,
        uniqueId: user.uniqueId
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Onboarding failed for user ${user.userId}:`, error.message);
      return null;
    }
  }

  // Get questions using real API
  async getQuestions() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/questions`);
      return response.data.questions;
    } catch (error) {
      console.error('❌ Failed to get questions:', error.message);
      return [];
    }
  }

  // Get questions for specific round
  getQuestionsForRound(allQuestions, round, questionsPerRound = 5) {
    const startIndex = (round - 1) * questionsPerRound;
    const endIndex = startIndex + questionsPerRound;
    return allQuestions.slice(startIndex, endIndex);
  }

  // Simulate user answering questions for specific round
  async simulateUserRound(user, questions) {
    const userResults = {
      userId: user.userId,
      answers: [],
      success: false,
      totalResponseTime: 0
    };

    try {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionStartTime = Date.now();
        
        // Random thinking time
        const thinkingTime = Math.random() * 
          (this.config.thinkingTimeRange.max - this.config.thinkingTimeRange.min) + 
          this.config.thinkingTimeRange.min;
        await this.sleep(thinkingTime);
        
        // Random answer selection
        const selectedOption = Math.floor(Math.random() * question.options.length).toString();
        
        const answerData = {
          userId: user.userId,
          quizId: this.config.quizId,
          questionId: question.id,
          selectedOption,
          questionStartTimestamp: questionStartTime,
          responseTimeMs: Date.now() - questionStartTime,
          round: this.config.round
        };
        
        // Ensure all required fields are present and valid
        if (!answerData.userId || !answerData.quizId || !answerData.questionId || 
            answerData.selectedOption === undefined || !answerData.questionStartTimestamp) {
          throw new Error('Missing required fields in answer data');
        }
        
        try {
          const response = await axios.post(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/submit`, answerData);
          
          userResults.answers.push({
            questionId: question.id,
            success: true,
            responseTime: Date.now() - questionStartTime
          });
          
          userResults.totalResponseTime += (Date.now() - questionStartTime);
          this.results.successfulAnswers++;
          
        } catch (error) {
          userResults.answers.push({
            questionId: question.id,
            success: false,
            error: error.message
          });
          this.results.failedAnswers++;
        }
        
        this.results.totalAnswers++;
        
        // Small delay between questions
        await this.sleep(this.config.delayBetweenQuestions);
      }
      
      // User completed all questions successfully
      userResults.success = userResults.answers.every(a => a.success);
      if (userResults.success) {
        this.results.successfulUsers++;
      } else {
        this.results.failedUsers++;
      }
      
      return userResults;
      
    } catch (error) {
      console.error(`❌ User ${user.userId} failed:`, error.message);
      this.results.failedUsers++;
      return userResults;
    }
  }

  // Simulate single user
  async simulateUser(user) {
    try {
      // Onboard user
      const onboardResult = await this.onboardUser(user);
      if (!onboardResult) {
        this.results.failedUsers++;
        return null;
      }
      
      // Get all questions
      const allQuestions = await this.getQuestions();
      if (allQuestions.length === 0) {
        this.results.failedUsers++;
        return null;
      }
      
      // Get questions for specific round
      const roundQuestions = this.getQuestionsForRound(allQuestions, this.config.round);
      if (roundQuestions.length === 0) {
        this.results.failedUsers++;
        return null;
      }
      
      // Simulate answering questions for the round
      const roundResults = await this.simulateUserRound(user, roundQuestions);
      
      return roundResults;
      
    } catch (error) {
      console.error(`❌ User ${user.userId} simulation failed:`, error.message);
      this.results.failedUsers++;
      return null;
    }
  }

  // Run the test
  async runTest() {
    console.log(`\n📊 Starting real API test for ${config.userCount} users...\n`);
    
    // Step 1: Check server connectivity
    console.log('1️⃣ Checking server connectivity...');
    const quizInfo = await this.checkServerConnectivity();
    if (!quizInfo) {
      console.log('❌ Cannot connect to server. Exiting.');
      return;
    }
    console.log(`✅ Server connected. Quiz: ${quizInfo.name || 'Default'}`);
    
    // Step 2: Check quiz status
    if (!quizInfo.active) {
      console.log('⚠️  Quiz is not active. Please start the quiz first.');
      console.log('💡 You can start it from the admin dashboard.');
      return;
    }
    console.log(`✅ Quiz is active (Round ${quizInfo.currentRound})`);
    
    // Step 3: Get questions
    console.log('\n2️⃣ Getting questions...');
    const allQuestions = await this.getQuestions();
    if (allQuestions.length === 0) {
      console.log('❌ Failed to get questions. Exiting.');
      return;
    }
    
    const roundQuestions = this.getQuestionsForRound(allQuestions, this.config.round);
    console.log(`✅ Found ${roundQuestions.length} questions for Round ${this.config.round}`);
    
    // Step 4: Start user simulation
    console.log(`\n3️⃣ Starting simulation of ${this.config.userCount} users...\n`);
    
    const userPromises = [];
    
    // Create users with delay
    for (let i = 0; i < this.config.userCount; i++) {
      const user = this.generateUser(i);
      const userPromise = this.simulateUser(user);
      userPromises.push(userPromise);
      
      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`📈 Created ${i + 1}/${this.config.userCount} users...`);
      }
      
      // Small delay between user creation
      if (i < this.config.userCount - 1) {
        await this.sleep(this.config.delayBetweenUsers);
      }
    }
    
    console.log(`\n⏳ Waiting for all users to complete...\n`);
    
    // Wait for all users to complete
    const userResults = await Promise.allSettled(userPromises);
    
    // Process results
    userResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.results.totalUsers++;
        if (result.value.totalResponseTime) {
          this.results.responseTimes.push(result.value.totalResponseTime);
        }
      } else {
        this.results.failedUsers++;
      }
    });
    
    this.results.endTime = Date.now();
    this.displayResults();
  }

  // Display test results
  displayResults() {
    const totalDuration = this.results.endTime - this.results.startTime;
    const avgResponseTime = this.results.responseTimes.length > 0 
      ? this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length 
      : 0;
    
    const userSuccessRate = (this.results.successfulUsers / this.config.userCount) * 100;
    const answerSuccessRate = this.results.totalAnswers > 0 
      ? (this.results.successfulAnswers / this.results.totalAnswers) * 100 
      : 0;
    
    console.log('\n📈 REAL API TEST RESULTS');
    console.log('=' * 50);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`👥 Total Users: ${this.config.userCount}`);
    console.log(`✅ Successful Users: ${this.results.successfulUsers}`);
    console.log(`❌ Failed Users: ${this.results.failedUsers}`);
    console.log(`📊 User Success Rate: ${userSuccessRate.toFixed(1)}%`);
    console.log(`\n📝 Answer Statistics:`);
    console.log(`📤 Total Answers: ${this.results.totalAnswers}`);
    console.log(`✅ Successful Answers: ${this.results.successfulAnswers}`);
    console.log(`❌ Failed Answers: ${this.results.failedAnswers}`);
    console.log(`📊 Answer Success Rate: ${answerSuccessRate.toFixed(1)}%`);
    
    if (this.results.responseTimes.length > 0) {
      console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`🚀 Min Response Time: ${Math.min(...this.results.responseTimes)}ms`);
      console.log(`🐌 Max Response Time: ${Math.max(...this.results.responseTimes)}ms`);
    }
    
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('=' * 50);
    
    if (userSuccessRate >= 95) {
      console.log('🟢 EXCELLENT: Server handling load very well');
      console.log('• Ready for production load');
      console.log('• Can handle even more users');
    } else if (userSuccessRate >= 90) {
      console.log('🟡 GOOD: Server performing well under load');
      console.log('• Minor optimizations may be needed');
      console.log('• Monitor for performance degradation');
    } else if (userSuccessRate >= 80) {
      console.log('🟠 ACCEPTABLE: Server handling load adequately');
      console.log('• Consider optimizations');
      console.log('• Monitor database performance');
    } else {
      console.log('🔴 NEEDS IMPROVEMENT: Server struggling with load');
      console.log('• Review database connections');
      console.log('• Check Vercel function limits');
      console.log('• Consider scaling solutions');
    }
    
    console.log('\n✅ Real API test completed!');
    console.log('💡 Next steps:');
    console.log('• Check admin dashboard for results');
    console.log('• Evaluate round performance');
    console.log('• Monitor database for any issues');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function main() {
  try {
    const tester = new RealApiTester(config);
    await tester.runTest();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main(); 