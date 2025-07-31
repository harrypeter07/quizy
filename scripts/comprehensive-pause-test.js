const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hassan111';

// 15 comprehensive questions
const QUESTIONS = [
  {
    "id": "q1",
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswers": [{"option": 2, "points": 100}]
  },
  {
    "id": "q2",
    "text": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q3",
    "text": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q4",
    "text": "Who wrote 'Romeo and Juliet'?",
    "options": ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q5",
    "text": "What is the largest ocean on Earth?",
    "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    "correctAnswers": [{"option": 3, "points": 100}]
  },
  {
    "id": "q6",
    "text": "What is the chemical symbol for gold?",
    "options": ["Ag", "Au", "Fe", "Cu"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q7",
    "text": "What is the hardest natural substance on Earth?",
    "options": ["Steel", "Diamond", "Granite", "Iron"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q8",
    "text": "What is the speed of light?",
    "options": ["299,792 km/s", "199,792 km/s", "399,792 km/s", "499,792 km/s"],
    "correctAnswers": [{"option": 0, "points": 100}]
  },
  {
    "id": "q9",
    "text": "What is the largest organ in the human body?",
    "options": ["Heart", "Brain", "Liver", "Skin"],
    "correctAnswers": [{"option": 3, "points": 100}]
  },
  {
    "id": "q10",
    "text": "What is the atomic number of carbon?",
    "options": ["4", "6", "8", "12"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q11",
    "text": "In which year did World War II end?",
    "options": ["1943", "1944", "1945", "1946"],
    "correctAnswers": [{"option": 2, "points": 100}]
  },
  {
    "id": "q12",
    "text": "Who was the first President of the United States?",
    "options": ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
    "correctAnswers": [{"option": 2, "points": 100}]
  },
  {
    "id": "q13",
    "text": "What year did Columbus discover America?",
    "options": ["1490", "1492", "1495", "1500"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q14",
    "text": "Which empire was ruled by Genghis Khan?",
    "options": ["Roman Empire", "Mongol Empire", "Ottoman Empire", "British Empire"],
    "correctAnswers": [{"option": 1, "points": 100}]
  },
  {
    "id": "q15",
    "text": "What was the name of the ship that sank in 1912?",
    "options": ["Lusitania", "Titanic", "Britannic", "Olympic"],
    "correctAnswers": [{"option": 1, "points": 100}]
  }
];

// Simulate 5 participants with different answer patterns
const PARTICIPANTS = [
  { name: "Alice", userId: "user_alice_123", uniqueId: "1001", answers: [2, 1, 1, 1, 3, 1, 1, 0, 3, 1, 2, 2, 1, 1, 1] }, // Mostly correct
  { name: "Bob", userId: "user_bob_456", uniqueId: "1002", answers: [0, 0, 2, 2, 0, 2, 2, 1, 0, 2, 0, 0, 2, 2, 0] }, // Mostly wrong
  { name: "Charlie", userId: "user_charlie_789", uniqueId: "1003", answers: [2, 1, 1, 1, 3, 1, 1, 0, 3, 1, 2, 2, 1, 1, 1] }, // Perfect score
  { name: "Diana", userId: "user_diana_101", uniqueId: "1004", answers: [1, 2, 3, 0, 1, 3, 0, 2, 1, 3, 1, 3, 0, 0, 2] }, // Mixed
  { name: "Eve", userId: "user_eve_202", uniqueId: "1005", answers: [2, 1, 1, 1, 3, 1, 1, 0, 3, 1, 2, 2, 1, 1, 1] } // Mostly correct
];

let QUIZ_ID = null;

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to log with timestamp
const log = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
};

// Create users
async function createUsers() {
  log("👥 Creating 5 participants...");
  
  for (const participant of PARTICIPANTS) {
    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: participant.userId,
          displayName: participant.name,
          uniqueId: participant.uniqueId,
          quizId: QUIZ_ID,
          createdAt: new Date().toISOString()
        })
      });
      
      if (res.ok) {
        log(`✅ Created user: ${participant.name} (ID: ${participant.uniqueId})`);
      } else {
        log(`❌ Failed to create user: ${participant.name}`);
      }
    } catch (error) {
      log(`❌ Error creating user ${participant.name}: ${error.message}`);
    }
  }
}

// Simulate participant answering a specific question
async function participantAnswer(participant, questionIndex, answerOption) {
  try {
    const question = QUESTIONS[questionIndex];
    const responseTimeMs = Math.floor(Math.random() * 10000) + 2000; // 2-12 seconds
    
    const answerData = {
      questionId: question.id,
      selectedOption: String(answerOption),
      questionStartTimestamp: Date.now() - responseTimeMs,
      responseTimeMs,
      userId: participant.userId,
      quizId: QUIZ_ID
    };

    const res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answerData)
    });

    if (res.ok) {
      log(`✅ ${participant.name} answered Q${questionIndex + 1} with option ${answerOption + 1} (${responseTimeMs}ms)`);
      return true;
    } else {
      const errorText = await res.text();
      log(`❌ ${participant.name} failed to answer Q${questionIndex + 1}: ${res.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    log(`❌ Error with ${participant.name} answering Q${questionIndex + 1}: ${error.message}`);
    return false;
  }
}

// Check if quiz is paused at current question
async function isQuizPausedAtQuestion(questionNumber) {
  try {
    const res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/status?question=${questionNumber}`);
    if (res.ok) {
      const data = await res.json();
      return data.isPaused;
    }
  } catch (error) {
    log(`❌ Error checking pause status: ${error.message}`);
  }
  return false;
}

// Simulate all participants answering current question
async function simulateQuestionAnswers(questionIndex) {
  log(`\n🎯 Simulating answers for Question ${questionIndex + 1}...`);
  
  // Check if quiz is paused at this question
  const isPaused = await isQuizPausedAtQuestion(questionIndex + 1);
  if (isPaused) {
    log(`⏸️ Quiz is PAUSED at question ${questionIndex + 1} - participants cannot answer`);
    return false;
  }
  
  const promises = PARTICIPANTS.map((participant, index) => {
    const answer = participant.answers[questionIndex];
    // Add some randomness to make it more realistic
    const randomDelay = Math.floor(Math.random() * 3000);
    return delay(randomDelay).then(() => participantAnswer(participant, questionIndex, answer));
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r).length;
  log(`✅ ${successCount}/${PARTICIPANTS.length} participants successfully answered Question ${questionIndex + 1}`);
  
  return successCount > 0;
}

// Get leaderboard data
async function getLeaderboard() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/leaderboard?quizId=${QUIZ_ID}&limit=10`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    log(`❌ Error getting leaderboard: ${error.message}`);
  }
  return null;
}

// Set pause points
async function setPausePoints(pausePoints) {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ pausePoints })
    });
    
    if (res.ok) {
      const data = await res.json();
      log(`✅ Pause points set: ${pausePoints.join(', ')}`);
      return data;
    }
  } catch (error) {
    log(`❌ Error setting pause points: ${error.message}`);
  }
  return null;
}

// Resume quiz
async function resumeQuiz() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      log(`✅ Quiz resumed successfully`);
      return data;
    }
  } catch (error) {
    log(`❌ Error resuming quiz: ${error.message}`);
  }
  return null;
}

// Evaluate quiz
async function evaluateQuiz() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      log(`✅ Quiz evaluated successfully`);
      return data;
    }
  } catch (error) {
    log(`❌ Error evaluating quiz: ${error.message}`);
  }
  return null;
}

// Display leaderboard
function displayLeaderboard(leaderboardData) {
  if (!leaderboardData || !leaderboardData.entries) {
    log("❌ No leaderboard data available");
    return;
  }
  
  log("\n🏆 LEADERBOARD RESULTS:");
  log("=".repeat(50));
  
  leaderboardData.entries.forEach((entry, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
    log(`${medal} ${entry.rank}. ${entry.displayName} (${entry.uniqueId}) - ${entry.score} points (${entry.correctAnswers}/${entry.totalQuestions} correct)`);
  });
  
  if (leaderboardData.stats) {
    log("\n📊 STATISTICS:");
    log(`Average Score: ${leaderboardData.stats.averageScore?.toFixed(1) || 'N/A'}`);
    log(`Highest Score: ${leaderboardData.stats.highestScore || 'N/A'}`);
    log(`Total Participants: ${leaderboardData.totalParticipants || 'N/A'}`);
  }
  
  log("=".repeat(50));
}

// Main test function
async function comprehensivePauseTest() {
  log("🚀 Starting Comprehensive Pause Functionality Test");
  log("=".repeat(60));
  
  try {
    // Step 1: Create quiz
    log("\n📝 Step 1: Creating quiz with 15 questions...");
    const createQuizRes = await fetch(`${BASE_URL}/api/admin/quiz/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        name: 'Comprehensive Pause Test Quiz',
        questionCount: 15,
        questions: QUESTIONS
      })
    });

    if (createQuizRes.ok) {
      const createData = await createQuizRes.json();
      QUIZ_ID = createData.quizId;
      log(`✅ Quiz created: ${QUIZ_ID}`);
    } else {
      log(`❌ Failed to create quiz: ${await createQuizRes.text()}`);
      return;
    }

    // Step 2: Create users
    await createUsers();

    // Step 3: Start quiz
    log("\n🎬 Step 3: Starting the quiz...");
    const startRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (startRes.ok) {
      log("✅ Quiz started successfully");
    } else {
      log(`❌ Failed to start quiz: ${await startRes.text()}`);
      return;
    }

    // Step 4: Simulate questions 1-5
    log("\n📚 Step 4: Simulating questions 1-5...");
    for (let i = 0; i < 5; i++) {
      await simulateQuestionAnswers(i);
      await delay(2000); // Wait 2 seconds between questions
    }

    // Step 5: Set pause at question 5 and evaluate
    log("\n⏸️ Step 5: Setting pause at question 5 and evaluating...");
    await setPausePoints([5]);
    
    // Evaluate
    const evalResult = await evaluateQuiz();
    log(`📈 Evaluation result: ${evalResult?.totalEvaluated || 0} participants evaluated`);
    
    // Get and display leaderboard
    const leaderboardAfter5 = await getLeaderboard();
    displayLeaderboard(leaderboardAfter5);

    // Step 6: Try to answer question 6 (should be blocked by pause)
    log("\n🚫 Step 6: Testing pause functionality - trying to answer question 6...");
    const blockedResult = await simulateQuestionAnswers(5);
    if (!blockedResult) {
      log("✅ Pause functionality working correctly - participants cannot answer when paused");
    }

    // Step 7: Resume and continue to question 10
    log("\n▶️ Step 7: Resuming quiz and continuing to question 10...");
    await resumeQuiz();
    
    for (let i = 5; i < 10; i++) {
      await simulateQuestionAnswers(i);
      await delay(2000);
    }

    // Step 8: Set pause at question 10 and evaluate again
    log("\n⏸️ Step 8: Setting pause at question 10 and evaluating...");
    await setPausePoints([10]);
    
    const evalResult2 = await evaluateQuiz();
    log(`📈 Second evaluation result: ${evalResult2?.totalEvaluated || 0} participants evaluated`);
    
    const leaderboardAfter10 = await getLeaderboard();
    displayLeaderboard(leaderboardAfter10);

    // Step 9: Try to answer question 11 (should be blocked by pause)
    log("\n🚫 Step 9: Testing pause functionality again - trying to answer question 11...");
    const blockedResult2 = await simulateQuestionAnswers(10);
    if (!blockedResult2) {
      log("✅ Pause functionality working correctly again - participants cannot answer when paused");
    }

    // Step 10: Resume and finish all questions
    log("\n▶️ Step 10: Resuming quiz and finishing all questions...");
    await resumeQuiz();
    
    for (let i = 10; i < 15; i++) {
      await simulateQuestionAnswers(i);
      await delay(2000);
    }

    // Step 11: Final evaluation
    log("\n🏁 Step 11: Final evaluation...");
    const finalEval = await evaluateQuiz();
    log(`📈 Final evaluation result: ${finalEval?.totalEvaluated || 0} participants evaluated`);
    
    const finalLeaderboard = await getLeaderboard();
    displayLeaderboard(finalLeaderboard);

    // Step 12: Cleanup
    log("\n🧹 Step 12: Cleaning up...");
    const deleteRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (deleteRes.ok) {
      log("✅ Test quiz deleted successfully");
    } else {
      log(`❌ Failed to delete test quiz: ${await deleteRes.text()}`);
    }

    log("\n🎉 Comprehensive pause functionality test completed successfully!");
    log("=".repeat(60));

  } catch (error) {
    log(`❌ Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run the comprehensive test
comprehensivePauseTest(); 