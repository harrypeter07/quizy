const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hassan111';

async function testQuestionSpecificPause() {
  console.log('🧪 Testing Question-Specific Pause Logic...\n');

  try {
    // Step 1: Create quiz
    console.log('1. Creating quiz...');
    const createQuizRes = await fetch(`${BASE_URL}/api/admin/quiz/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        name: 'Question-Specific Pause Test',
        questionCount: 10,
        questions: [
          { "id": "q1", "text": "Q1", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 0, "points": 100}] },
          { "id": "q2", "text": "Q2", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 1, "points": 100}] },
          { "id": "q3", "text": "Q3", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 2, "points": 100}] },
          { "id": "q4", "text": "Q4", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 3, "points": 100}] },
          { "id": "q5", "text": "Q5", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 0, "points": 100}] },
          { "id": "q6", "text": "Q6", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 1, "points": 100}] },
          { "id": "q7", "text": "Q7", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 2, "points": 100}] },
          { "id": "q8", "text": "Q8", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 3, "points": 100}] },
          { "id": "q9", "text": "Q9", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 0, "points": 100}] },
          { "id": "q10", "text": "Q10", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 1, "points": 100}] }
        ]
      })
    });

    if (!createQuizRes.ok) {
      console.log('❌ Failed to create quiz:', await createQuizRes.text());
      return;
    }

    const createData = await createQuizRes.json();
    const QUIZ_ID = createData.quizId;
    console.log('✅ Quiz created:', QUIZ_ID);

    // Step 2: Create users
    console.log('\n2. Creating users...');
    const users = [
      { userId: 'user1', displayName: 'User1', uniqueId: '1001' },
      { userId: 'user2', displayName: 'User2', uniqueId: '1002' },
      { userId: 'user3', displayName: 'User3', uniqueId: '1003' }
    ];

    for (const user of users) {
      const userRes = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          quizId: QUIZ_ID,
          createdAt: new Date().toISOString()
        })
      });
      if (userRes.ok) {
        console.log(`✅ Created user: ${user.displayName}`);
      }
    }

    // Step 3: Start quiz
    console.log('\n3. Starting quiz...');
    const startRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (startRes.ok) {
      console.log('✅ Quiz started');
    } else {
      console.log('❌ Failed to start quiz:', await startRes.text());
      return;
    }

    // Step 4: Let users answer some questions
    console.log('\n4. Users answering questions...');
    
    // User1 answers Q1-Q3
    for (let i = 1; i <= 3; i++) {
      const submitRes = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user1',
          quizId: QUIZ_ID,
          questionId: `q${i}`,
          selectedOption: '0',
          questionStartTimestamp: Date.now() - 5000,
          responseTimeMs: 5000
        })
      });
      if (submitRes.ok) {
        console.log(`✅ User1 answered Q${i}`);
      }
    }

    // User2 answers Q1-Q5
    for (let i = 1; i <= 5; i++) {
      const submitRes = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user2',
          quizId: QUIZ_ID,
          questionId: `q${i}`,
          selectedOption: '0',
          questionStartTimestamp: Date.now() - 5000,
          responseTimeMs: 5000
        })
      });
      if (submitRes.ok) {
        console.log(`✅ User2 answered Q${i}`);
      }
    }

    // User3 answers Q1-Q7
    for (let i = 1; i <= 7; i++) {
      const submitRes = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user3',
          quizId: QUIZ_ID,
          questionId: `q${i}`,
          selectedOption: '0',
          questionStartTimestamp: Date.now() - 5000,
          responseTimeMs: 5000
        })
      });
      if (submitRes.ok) {
        console.log(`✅ User3 answered Q${i}`);
      }
    }

    // Step 5: Set pause at Q5
    console.log('\n5. Setting pause at Q5...');
    const pauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ pausePoints: [5] })
    });
    
    if (pauseRes.ok) {
      console.log('✅ Pause set at Q5');
    } else {
      console.log('❌ Failed to set pause:', await pauseRes.text());
      return;
    }

    // Step 6: Test question-specific pausing
    console.log('\n6. Testing question-specific pausing...');
    
    // Test User1 (progress: Q3) trying to answer Q4 (should work)
    console.log('\nTesting User1 (progress: Q3) answering Q4...');
    const user1Q4Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user1',
        quizId: QUIZ_ID,
        questionId: 'q4',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (user1Q4Res.ok) {
      console.log('✅ User1 can answer Q4 (within progress)');
    } else {
      const error = await user1Q4Res.text();
      console.log('❌ User1 cannot answer Q4:', error);
    }

    // Test User1 trying to answer Q5 (should be blocked)
    console.log('\nTesting User1 (progress: Q4) answering Q5...');
    const user1Q5Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user1',
        quizId: QUIZ_ID,
        questionId: 'q5',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (user1Q5Res.ok) {
      console.log('❌ User1 can answer Q5 (should be blocked)');
    } else {
      const error = await user1Q5Res.text();
      console.log('✅ User1 cannot answer Q5 (correctly blocked):', error);
    }

    // Test User2 (progress: Q5) trying to answer Q5 (should be blocked)
    console.log('\nTesting User2 (progress: Q5) answering Q5...');
    const user2Q5Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user2',
        quizId: QUIZ_ID,
        questionId: 'q5',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (user2Q5Res.ok) {
      console.log('❌ User2 can answer Q5 (should be blocked)');
    } else {
      const error = await user2Q5Res.text();
      console.log('✅ User2 cannot answer Q5 (correctly blocked):', error);
    }

    // Test User3 (progress: Q7) trying to answer Q6 (should work)
    console.log('\nTesting User3 (progress: Q7) answering Q6...');
    const user3Q6Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user3',
        quizId: QUIZ_ID,
        questionId: 'q6',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (user3Q6Res.ok) {
      console.log('✅ User3 can answer Q6 (within progress)');
    } else {
      const error = await user3Q6Res.text();
      console.log('❌ User3 cannot answer Q6:', error);
    }

    // Test User3 trying to answer Q8 (should work - beyond pause point)
    console.log('\nTesting User3 (progress: Q7) answering Q8...');
    const user3Q8Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user3',
        quizId: QUIZ_ID,
        questionId: 'q8',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (user3Q8Res.ok) {
      console.log('✅ User3 can answer Q8 (beyond pause point)');
    } else {
      const error = await user3Q8Res.text();
      console.log('❌ User3 cannot answer Q8:', error);
    }

    // Step 7: Resume quiz
    console.log('\n7. Resuming quiz...');
    const resumeRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (resumeRes.ok) {
      console.log('✅ Quiz resumed');
    } else {
      console.log('❌ Failed to resume quiz:', await resumeRes.text());
    }

    // Step 8: Test that users can now answer any question
    console.log('\n8. Testing that users can answer any question after resume...');
    
    const user1Q5AfterResume = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user1',
        quizId: QUIZ_ID,
        questionId: 'q5',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (user1Q5AfterResume.ok) {
      console.log('✅ User1 can answer Q5 after resume');
    } else {
      const error = await user1Q5AfterResume.text();
      console.log('❌ User1 cannot answer Q5 after resume:', error);
    }

    // Step 9: Cleanup
    console.log('\n9. Cleaning up...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (deleteRes.ok) {
      console.log('✅ Test quiz deleted');
    } else {
      console.log('❌ Failed to delete test quiz:', await deleteRes.text());
    }

    console.log('\n🎉 Question-specific pause test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQuestionSpecificPause(); 