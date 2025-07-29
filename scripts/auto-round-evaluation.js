#!/usr/bin/env node

const axios = require('axios');

// Configuration
const config = {
  baseUrl: process.argv[2] || 'http://localhost:3000',
  quizId: process.argv[3] || 'default',
  adminToken: process.env.ADMIN_TOKEN || 'your-admin-token-here'
};

console.log('🔄 Auto Round Evaluation Script');
console.log('=' * 40);
console.log(`URL: ${config.baseUrl}`);
console.log(`Quiz: ${config.quizId}`);
console.log('=' * 40);

class AutoRoundEvaluator {
  constructor(config) {
    this.config = config;
  }

  // Check if quiz is active
  async checkQuizStatus() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/quiz-info`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get quiz status:', error.message);
      return null;
    }
  }

  // Start the quiz if not already started
  async startQuiz() {
    try {
      console.log('🚀 Starting quiz...');
      const response = await axios.post(`${this.config.baseUrl}/api/admin/quiz/${this.config.quizId}/start`);
      console.log('✅ Quiz started successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to start quiz:', error.message);
      return null;
    }
  }

  // Get current round status
  async getRoundStatus() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/round-status`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get round status:', error.message);
      return null;
    }
  }

  // Auto transition to next round
  async autoTransitionRound() {
    try {
      console.log('🔄 Auto transitioning to next round...');
      const response = await axios.post(`${this.config.baseUrl}/api/quiz/${this.config.quizId}/auto-transition`);
      console.log('✅ Round transition completed');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to auto transition round:', error.message);
      return null;
    }
  }

  // Evaluate round 1
  async evaluateRound1() {
    try {
      console.log('📊 Evaluating Round 1...');
      const response = await axios.post(
        `${this.config.baseUrl}/api/admin/quiz/${this.config.quizId}/evaluate-round`,
        { round: 1 },
        {
          headers: {
            'Authorization': `Bearer ${this.config.adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Round 1 evaluation completed');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to evaluate round 1:', error.message);
      return null;
    }
  }

  // Get evaluation results
  async getEvaluationResults() {
    try {
      console.log('📈 Getting evaluation results...');
      const response = await axios.get(`${this.config.baseUrl}/api/admin/leaderboard`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get evaluation results:', error.message);
      return null;
    }
  }

  // Display evaluation results
  displayResults(results) {
    if (!results || !results.entries) {
      console.log('❌ No evaluation results found');
      return;
    }

    console.log('\n📊 ROUND 1 EVALUATION RESULTS');
    console.log('=' * 50);
    console.log(`Total Participants: ${results.totalParticipants || 'N/A'}`);
    console.log(`Evaluated At: ${new Date(results.evaluatedAt).toLocaleString()}`);
    
    if (results.entries && results.entries.length > 0) {
      console.log('\n🏆 TOP 10 PARTICIPANTS:');
      console.log('Rank | User | Score | Accuracy | Avg Response Time');
      console.log('-'.repeat(60));
      
      results.entries.slice(0, 10).forEach((entry, index) => {
        console.log(`${(index + 1).toString().padStart(2)} | ${entry.displayName.padEnd(15)} | ${entry.score.toString().padStart(4)} | ${(entry.accuracy * 100).toFixed(1).padStart(5)}% | ${entry.averageResponseTime.toFixed(0).padStart(4)}ms`);
      });
    }

    if (results.stats) {
      console.log('\n📈 STATISTICS:');
      console.log(`Average Score: ${results.stats.averageScore?.toFixed(2) || 'N/A'}`);
      console.log(`Average Accuracy: ${(results.stats.averageAccuracy * 100)?.toFixed(1) || 'N/A'}%`);
      console.log(`Average Response Time: ${results.stats.averageResponseTime?.toFixed(0) || 'N/A'}ms`);
      console.log(`Highest Score: ${results.stats.highestScore || 'N/A'}`);
      console.log(`Lowest Score: ${results.stats.lowestScore || 'N/A'}`);
    }
  }

  // Run the complete evaluation process
  async runEvaluation() {
    console.log('\n🔄 Starting auto round evaluation process...\n');

    // Step 1: Check quiz status
    console.log('1️⃣ Checking quiz status...');
    const quizStatus = await this.checkQuizStatus();
    if (!quizStatus) {
      console.log('❌ Cannot proceed without quiz status');
      return;
    }
    console.log(`✅ Quiz status: ${quizStatus.active ? 'Active' : 'Inactive'}`);

    // Step 2: Start quiz if needed
    if (!quizStatus.active) {
      const startResult = await this.startQuiz();
      if (!startResult) {
        console.log('❌ Cannot proceed without starting quiz');
        return;
      }
    }

    // Step 3: Check current round
    console.log('\n2️⃣ Checking current round...');
    const roundStatus = await this.getRoundStatus();
    if (!roundStatus) {
      console.log('❌ Cannot get round status');
      return;
    }
    console.log(`✅ Current round: ${roundStatus.currentRound}`);

    // Step 4: Auto transition if needed
    if (roundStatus.currentRound === 1) {
      console.log('\n3️⃣ Auto transitioning to next round...');
      const transitionResult = await this.autoTransitionRound();
      if (!transitionResult) {
        console.log('❌ Failed to transition round');
        return;
      }
    }

    // Step 5: Evaluate round 1
    console.log('\n4️⃣ Evaluating round 1...');
    const evaluationResult = await this.evaluateRound1();
    if (!evaluationResult) {
      console.log('❌ Failed to evaluate round 1');
      return;
    }

    // Step 6: Get and display results
    console.log('\n5️⃣ Getting evaluation results...');
    const results = await this.getEvaluationResults();
    this.displayResults(results);

    console.log('\n✅ Auto round evaluation completed!');
    console.log('💡 Next steps:');
    console.log('• Check admin dashboard for detailed results');
    console.log('• Monitor database for any issues');
    console.log('• Review performance metrics');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the evaluation
async function main() {
  try {
    const evaluator = new AutoRoundEvaluator(config);
    await evaluator.runEvaluation();
  } catch (error) {
    console.error('❌ Evaluation failed:', error.message);
    process.exit(1);
  }
}

main(); 