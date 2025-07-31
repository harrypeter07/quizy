const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hassan111';

async function quickPauseDebug() {
  console.log('🔍 Quick Pause Debug...\n');

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
        name: 'Quick Debug Quiz',
        questionCount: 5,
        questions: [
          { "id": "q1", "text": "Q1", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 0, "points": 100}] },
          { "id": "q2", "text": "Q2", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 1, "points": 100}] },
          { "id": "q3", "text": "Q3", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 2, "points": 100}] },
          { "id": "q4", "text": "Q4", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 3, "points": 100}] },
          { "id": "q5", "text": "Q5", "options": ["A", "B", "C", "D"], "correctAnswers": [{"option": 0, "points": 100}] }
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

    // Step 2: Create user
    console.log('\n2. Creating user...');
    const userRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'debuguser',
        displayName: 'DebugUser',
        uniqueId: 'debug123',
        quizId: QUIZ_ID,
        createdAt: new Date().toISOString()
      })
    });
    if (userRes.ok) {
      console.log('✅ Created user: DebugUser');
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

    // Step 4: Set pause at Q3
    console.log('\n4. Setting pause at Q3...');
    const pauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ pausePoints: [3] })
    });
    
    if (pauseRes.ok) {
      console.log('✅ Pause set at Q3');
    } else {
      console.log('❌ Failed to set pause:', await pauseRes.text());
      return;
    }

    // Step 5: Test pause logic
    console.log('\n5. Testing pause logic...');
    
    // Try to answer Q1 (should work)
    console.log('\n--- Testing Q1 (should work) ---');
    const q1Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'debuguser',
        quizId: QUIZ_ID,
        questionId: 'q1',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (q1Res.ok) {
      console.log('✅ Q1 answered successfully');
    } else {
      const error = await q1Res.text();
      console.log('❌ Q1 blocked:', error);
    }

    // Try to answer Q2 (should work)
    console.log('\n--- Testing Q2 (should work) ---');
    const q2Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'debuguser',
        quizId: QUIZ_ID,
        questionId: 'q2',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (q2Res.ok) {
      console.log('✅ Q2 answered successfully');
    } else {
      const error = await q2Res.text();
      console.log('❌ Q2 blocked:', error);
    }

    // Try to answer Q3 (should be blocked)
    console.log('\n--- Testing Q3 (should be blocked) ---');
    const q3Res = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'debuguser',
        quizId: QUIZ_ID,
        questionId: 'q3',
        selectedOption: '0',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (q3Res.ok) {
      console.log('❌ Q3 answered (should be blocked)');
    } else {
      const error = await q3Res.text();
      console.log('✅ Q3 blocked correctly:', error);
    }

    // Step 6: Cleanup
    console.log('\n6. Cleaning up...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (deleteRes.ok) {
      console.log('✅ Test quiz deleted');
    } else {
      console.log('❌ Failed to delete test quiz:', await deleteRes.text());
    }

    console.log('\n🎉 Quick pause debug completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickPauseDebug(); 