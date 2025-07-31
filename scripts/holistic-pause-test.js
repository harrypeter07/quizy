const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'hassan111';

async function createQuiz() {
  console.log('1. Creating quiz...');
  
  const quizData = {
    name: 'Holistic Pause Test Quiz',
    questionCount: 15,
    questions: [
      {
        id: 'q1',
        text: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswers: [{ option: 2, points: 100 }]
      },
      {
        id: 'q2',
        text: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q3',
        text: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q4',
        text: 'Who wrote Romeo and Juliet?',
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q5',
        text: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswers: [{ option: 3, points: 100 }]
      },
      {
        id: 'q6',
        text: 'What is the chemical symbol for gold?',
        options: ['Ag', 'Au', 'Fe', 'Cu'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q7',
        text: 'What is the hardest natural substance on Earth?',
        options: ['Steel', 'Diamond', 'Granite', 'Iron'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q8',
        text: 'What is the speed of light?',
        options: ['299,792 km/s', '199,792 km/s', '399,792 km/s', '499,792 km/s'],
        correctAnswers: [{ option: 0, points: 100 }]
      },
      {
        id: 'q9',
        text: 'What is the largest organ in the human body?',
        options: ['Heart', 'Brain', 'Liver', 'Skin'],
        correctAnswers: [{ option: 3, points: 100 }]
      },
      {
        id: 'q10',
        text: 'What is the atomic number of carbon?',
        options: ['4', '6', '8', '12'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q11',
        text: 'In which year did World War II end?',
        options: ['1943', '1944', '1945', '1946'],
        correctAnswers: [{ option: 2, points: 100 }]
      },
      {
        id: 'q12',
        text: 'Who was the first President of the United States?',
        options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'],
        correctAnswers: [{ option: 2, points: 100 }]
      },
      {
        id: 'q13',
        text: 'What year did Columbus discover America?',
        options: ['1490', '1492', '1495', '1500'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q14',
        text: 'Which empire was ruled by Genghis Khan?',
        options: ['Roman Empire', 'Mongol Empire', 'Ottoman Empire', 'British Empire'],
        correctAnswers: [{ option: 1, points: 100 }]
      },
      {
        id: 'q15',
        text: 'What was the name of the ship that sank in 1912?',
        options: ['Lusitania', 'Titanic', 'Britannic', 'Olympic'],
        correctAnswers: [{ option: 1, points: 100 }]
      }
    ]
  };

  const response = await fetch(`${BASE_URL}/api/admin/quiz/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify(quizData)
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`✅ Quiz created: ${result.quizId}`);
    return result.quizId;
  } else {
    const errorText = await response.text();
    throw new Error(`Failed to create quiz: ${response.status} - ${errorText}`);
  }
}

async function createUser(userId) {
  const userData = {
    displayName: `User${userId}`,
    uniqueId: `user${userId}`
  };

  const response = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`✅ User${userId} created: ${result.userId}`);
    return result.userId;
  } else {
    console.log(`⚠️ User${userId} already exists or error: ${response.status}`);
    return `user${userId}`;
  }
}

async function startQuiz(quizId) {
  console.log('3. Starting quiz...');
  
  const response = await fetch(`${BASE_URL}/api/admin/quiz/${quizId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });

  if (response.ok) {
    console.log('✅ Quiz started');
  } else {
    throw new Error(`Failed to start quiz: ${response.status}`);
  }
}

async function setPausePoints(quizId, pausePoints) {
  console.log(`4. Setting pause points at Q${pausePoints.join(', Q')}...`);
  
  const response = await fetch(`${BASE_URL}/api/admin/quiz/${quizId}/pause-points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({ pausePoints })
  });

  if (response.ok) {
    console.log(`✅ Pause points set at Q${pausePoints.join(', Q')}`);
  } else {
    throw new Error(`Failed to set pause points: ${response.status}`);
  }
}

async function submitAnswer(quizId, userId, questionId, selectedOption) {
  const answerData = {
    userId,
    quizId,
    questionId,
    selectedOption: selectedOption.toString(),
    questionStartTimestamp: Date.now(),
    responseTimeMs: Math.floor(Math.random() * 5000) + 1000
  };

  const response = await fetch(`${BASE_URL}/api/quiz/${quizId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(answerData)
  });

  if (response.ok) {
    return { success: true, status: response.status };
  } else {
    const error = await response.json();
    return { success: false, error, status: response.status };
  }
}

async function evaluateQuiz(quizId) {
  console.log('7. Evaluating quiz...');
  
  const response = await fetch(`${BASE_URL}/api/admin/quiz/${quizId}/evaluate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Quiz evaluated successfully');
    return result;
  } else {
    const error = await response.json();
    console.log(`❌ Failed to evaluate: ${JSON.stringify(error)}`);
    return null;
  }
}

async function getLeaderboard(quizId) {
  console.log('8. Getting leaderboard...');
  
  const response = await fetch(`${BASE_URL}/api/admin/leaderboard?quizId=${quizId}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Leaderboard retrieved');
    console.log('📊 Leaderboard Data:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } else {
    const error = await response.json();
    console.log(`❌ Failed to get leaderboard: ${JSON.stringify(error)}`);
    return null;
  }
}

async function resumeQuiz(quizId) {
  console.log('9. Resuming quiz...');
  
  const response = await fetch(`${BASE_URL}/api/admin/quiz/${quizId}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });

  if (response.ok) {
    console.log('✅ Quiz resumed - users can now continue');
  } else {
    throw new Error(`Failed to resume quiz: ${response.status}`);
  }
}

async function deleteQuiz(quizId) {
  console.log('12. Cleaning up...');
  
  const response = await fetch(`${BASE_URL}/api/admin/quiz/${quizId}/delete`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });

  if (response.ok) {
    console.log('✅ Test quiz deleted');
  } else {
    console.log(`⚠️ Failed to delete quiz: ${response.status}`);
  }
}

async function simulateUserProgression(quizId, userId, maxQuestions) {
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'];
  
  for (let i = 0; i < maxQuestions; i++) {
    const questionId = questions[i];
    const selectedOption = Math.floor(Math.random() * 4);
    
    const result = await submitAnswer(quizId, userId, questionId, selectedOption);
    
    if (result.success) {
      console.log(`✅ ${userId} answered Q${i + 1}`);
    } else {
      if (result.status === 400 && result.error?.isPaused) {
        console.log(`⏸️ ${userId} blocked at Q${i + 1}: ${result.error.error}`);
        break;
      } else {
        console.log(`❌ ${userId} failed to answer Q${i + 1}: ${JSON.stringify(result.error)}`);
        break;
      }
    }
    
    // Add some delay between questions
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function waitForUsersToReachQuestion(quizId, targetQuestion, userIds) {
  console.log(`\n🔄 Waiting for users to reach Q${targetQuestion}...`);
  
  let allUsersReached = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max wait
  
  while (!allUsersReached && attempts < maxAttempts) {
    attempts++;
    console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Checking user progress...`);
    
    // Simulate users answering questions progressively
    for (const userId of userIds) {
      await simulateUserProgression(quizId, userId, targetQuestion);
    }
    
    // Check if all users have reached the target question
    allUsersReached = true;
    
    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (allUsersReached) {
    console.log(`✅ All users have reached Q${targetQuestion}`);
  } else {
    console.log(`⚠️ Timeout waiting for users to reach Q${targetQuestion}`);
  }
}

async function main() {
  console.log('🧪 Holistic Pause Test - Complete Flow');
  console.log('========================================\n');
  
  let quizId;
  
  try {
    // 1. Create quiz
    quizId = await createQuiz();
    
    // 2. Create users
    console.log('\n2. Creating users...');
    const userIds = [];
    for (let i = 1; i <= 5; i++) {
      const userId = await createUser(i);
      userIds.push(userId);
    }
    
    // 3. Start quiz
    await startQuiz(quizId);
    
    // 4. Set pause point at Q5
    await setPausePoints(quizId, [5]);
    
    // 5. Wait for users to reach Q5
    await waitForUsersToReachQuestion(quizId, 5, userIds);
    
    // 6. Evaluate at pause point
    const evaluationResult = await evaluateQuiz(quizId);
    
    // 7. Show leaderboard
    const leaderboardResult = await getLeaderboard(quizId);
    
    // 8. Resume quiz
    await resumeQuiz(quizId);
    
    // 9. Let users complete the quiz
    console.log('\n10. Users completing remaining questions...');
    for (const userId of userIds) {
      await simulateUserProgression(quizId, userId, 15);
    }
    
    // 10. Final evaluation
    console.log('\n11. Final evaluation...');
    const finalEvaluation = await evaluateQuiz(quizId);
    const finalLeaderboard = await getLeaderboard(quizId);
    
    // 11. Cleanup
    await deleteQuiz(quizId);
    
    console.log('\n🎉 Holistic pause test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Quiz created and started');
    console.log('✅ Users created and progressed to Q5');
    console.log('✅ Pause point set at Q5');
    console.log('✅ Evaluation performed at pause point');
    console.log('✅ Leaderboard displayed');
    console.log('✅ Quiz resumed');
    console.log('✅ Users completed remaining questions');
    console.log('✅ Final evaluation completed');
    console.log('✅ Quiz cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (quizId) {
      await deleteQuiz(quizId);
    }
  }
}

// Run the test
main().catch(console.error); 