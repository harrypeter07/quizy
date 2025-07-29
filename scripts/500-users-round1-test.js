#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Test configuration for 500 users, round 1 only
const config = {
  baseUrl: process.argv[2] || 'http://localhost:3000',
  userCount: 500,
  quizId: process.argv[3] || 'default',
  round: 1,
  questionsPerRound: 5,
  delayBetweenUsers: 50, // 50ms between user creation
  delayBetweenQuestions: 200, // 200ms between questions
  thinkingTimeRange: { min: 1000, max: 3000 } // 1-3 seconds thinking time
};

console.log('🚀 500 Users Round 1 Test');
console.log('=' * 50);
console.log(`URL: ${config.baseUrl}`);
console.log(`Users: ${config.userCount}`);
console.log(`Quiz: ${config.quizId}`);
console.log(`Round: ${config.round}`);
console.log(`Questions: ${config.questionsPerRound}`);
console.log('=' * 50);

class Round1Tester {
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
    const userId = `test-${index}-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const uniqueId = Math.floor(Math.random() * 9000) + 1000; // Ensure 4 digits
    
    return {
      userId,
      displayName: `${randomName}${uniqueId}`,
      uniqueId: uniqueId.toString(),
      index
    };
  }

  // Simulate user onboarding
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

  // Get questions for round 1
  async getRoundQuestions() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/questions`);
      const allQuestions = response.data.questions;
      // Get only first 5 questions (round 1)
      return allQuestions.slice(0, this.config.questionsPerRound);
    } catch (error) {
      console.error('❌ Failed to get questions:', error.message);
      return [];
    }
  }

  // Check quiz status
  async checkQuizStatus() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/quiz-info`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get quiz status:', error.message);
      return null;
    }
  }

  // Simulate user answering round 1 questions
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
      
      // Get questions for round 1
      const questions = await this.getRoundQuestions();
      if (questions.length === 0) {
        this.results.failedUsers++;
        return null;
      }
      
      // Simulate answering round 1 questions
      const roundResults = await this.simulateUserRound(user, questions);
      
      return roundResults;
      
    } catch (error) {
      console.error(`❌ User ${user.userId} simulation failed:`, error.message);
      this.results.failedUsers++;
      return null;
    }
  }

  // Run the test
  async runTest() {
    console.log(`\n📊 Starting 500 users test for Round 1...\n`);
    
    // Check quiz status first
    console.log('🔍 Checking quiz status...');
    const quizStatus = await this.checkQuizStatus();
    if (!quizStatus) {
      console.log('❌ Failed to get quiz status. Exiting.');
      return;
    }
    
    if (!quizStatus.active) {
      console.log('⚠️  Quiz is not active. Please start the quiz first.');
      console.log('💡 You can start it from the admin dashboard or use the auto-round-evaluation script.');
      return;
    }
    
    console.log(`✅ Quiz is active (Round ${quizStatus.currentRound})`);
    
    // Get questions first
    const questions = await this.getRoundQuestions();
    if (questions.length === 0) {
      console.log('❌ Failed to get questions. Exiting.');
      return;
    }
    
    console.log(`✅ Found ${questions.length} questions for Round 1`);
    console.log(`🚀 Starting simulation of ${this.config.userCount} users...\n`);
    
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
        if (result.value.responseTime) {
          this.results.responseTimes.push(result.value.responseTime);
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
    
    console.log('\n📈 ROUND 1 TEST RESULTS');
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
      console.log('🟢 EXCELLENT: Server handling 500 users very well');
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
    
    console.log('\n✅ Round 1 test completed!');
    console.log('💡 Next steps:');
    console.log('• Check admin dashboard for results');
    console.log('• Evaluate round 1 performance');
    console.log('• Monitor database for any issues');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function main() {
  try {
    const tester = new Round1Tester(config);
    await tester.runTest();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main(); 