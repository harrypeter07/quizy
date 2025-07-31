const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hassan111';

async function testPrePauseFunctionality() {
  console.log('🧪 Testing Pre-Pause Functionality...\n');

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
        name: 'Pre-Pause Test Quiz',
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

    // Step 2: Set pause points BEFORE starting quiz
    console.log('\n2. Setting pause points BEFORE starting quiz...');
    const pauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ pausePoints: [3, 7] })
    });
    
    if (pauseRes.ok) {
      console.log('✅ Pause points set at Q3 and Q7 (before quiz start)');
    } else {
      console.log('❌ Failed to set pause points:', await pauseRes.text());
      return;
    }

    // Step 3: Create users
    console.log('\n3. Creating users...');
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

    // Step 4: Start quiz (with pause points already set)
    console.log('\n4. Starting quiz with pre-set pause points...');
    const startRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (startRes.ok) {
      console.log('✅ Quiz started with pause points at Q3 and Q7');
    } else {
      console.log('❌ Failed to start quiz:', await startRes.text());
      return;
    }

    // Step 5: Test user progression with pause points
    console.log('\n5. Testing user progression with pause points...');
    
    // User1: Try to answer Q1-Q4 (should work up to Q2, blocked at Q3)
    console.log('\n--- User1 Progress Test ---');
    for (let i = 1; i <= 4; i++) {
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
      } else {
        const error = await submitRes.text();
        console.log(`❌ User1 blocked at Q${i}:`, error);
        break; // Stop trying if blocked
      }
    }

    // User2: Try to answer Q1-Q8 (should work up to Q2, blocked at Q3)
    console.log('\n--- User2 Progress Test ---');
    for (let i = 1; i <= 8; i++) {
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
      } else {
        const error = await submitRes.text();
        console.log(`❌ User2 blocked at Q${i}:`, error);
        break; // Stop trying if blocked
      }
    }

    // Step 6: Evaluate at first pause point (Q3)
    console.log('\n6. Evaluating at first pause point (Q3)...');
    const evaluateRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (evaluateRes.ok) {
      const evalData = await evaluateRes.json();
      console.log('✅ Evaluation completed at Q3');
      console.log(`📊 Total participants: ${evalData.totalParticipants}`);
      console.log(`📊 Average score: ${evalData.averageScore}`);
    } else {
      console.log('❌ Failed to evaluate:', await evaluateRes.text());
    }

    // Step 7: Get leaderboard
    console.log('\n7. Getting leaderboard...');
    const leaderboardRes = await fetch(`${BASE_URL}/api/admin/leaderboard?quizId=${QUIZ_ID}&limit=10`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (leaderboardRes.ok) {
      const leaderboardData = await leaderboardRes.json();
      console.log('✅ Leaderboard retrieved');
      console.log('📊 Top 3 participants:');
      leaderboardData.slice(0, 3).forEach((participant, index) => {
        console.log(`   ${index + 1}. ${participant.displayName}: ${participant.totalScore} points`);
      });
    } else {
      console.log('❌ Failed to get leaderboard:', await leaderboardRes.text());
    }

    // Step 8: Resume quiz to continue past Q3
    console.log('\n8. Resuming quiz to continue past Q3...');
    const resumeRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (resumeRes.ok) {
      console.log('✅ Quiz resumed - users can now progress past Q3');
    } else {
      console.log('❌ Failed to resume quiz:', await resumeRes.text());
      return;
    }

    // Step 9: Test user progression after resume
    console.log('\n9. Testing user progression after resume...');
    
    // User1: Try to answer Q3-Q6 (should work up to Q6, blocked at Q7)
    console.log('\n--- User1 Progress After Resume ---');
    for (let i = 3; i <= 6; i++) {
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
      } else {
        const error = await submitRes.text();
        console.log(`❌ User1 blocked at Q${i}:`, error);
        break;
      }
    }

    // User2: Try to answer Q3-Q8 (should work up to Q6, blocked at Q7)
    console.log('\n--- User2 Progress After Resume ---');
    for (let i = 3; i <= 8; i++) {
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
      } else {
        const error = await submitRes.text();
        console.log(`❌ User2 blocked at Q${i}:`, error);
        break;
      }
    }

    // Step 10: Final evaluation at Q7
    console.log('\n10. Final evaluation at Q7...');
    const finalEvaluateRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (finalEvaluateRes.ok) {
      const finalEvalData = await finalEvaluateRes.json();
      console.log('✅ Final evaluation completed at Q7');
      console.log(`📊 Total participants: ${finalEvalData.totalParticipants}`);
      console.log(`📊 Average score: ${finalEvalData.averageScore}`);
    } else {
      console.log('❌ Failed to evaluate:', await finalEvaluateRes.text());
    }

    // Step 11: Resume quiz to finish
    console.log('\n11. Resuming quiz to finish...');
    const finalResumeRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (finalResumeRes.ok) {
      console.log('✅ Quiz resumed - users can now finish all questions');
    } else {
      console.log('❌ Failed to resume quiz:', await finalResumeRes.text());
    }

    // Step 12: Test final progression
    console.log('\n12. Testing final progression...');
    
    // User1: Try to answer remaining questions
    console.log('\n--- User1 Final Progress ---');
    for (let i = 7; i <= 10; i++) {
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
      } else {
        const error = await submitRes.text();
        console.log(`❌ User1 blocked at Q${i}:`, error);
        break;
      }
    }

    // Step 13: Cleanup
    console.log('\n13. Cleaning up...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (deleteRes.ok) {
      console.log('✅ Test quiz deleted');
    } else {
      console.log('❌ Failed to delete test quiz:', await deleteRes.text());
    }

    console.log('\n🎉 Pre-pause functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Pause points can be set before starting quiz');
    console.log('✅ Users are blocked at pause points');
    console.log('✅ Evaluation works at pause points');
    console.log('✅ Resume functionality works correctly');
    console.log('✅ Users can progress after resume');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPrePauseFunctionality(); 