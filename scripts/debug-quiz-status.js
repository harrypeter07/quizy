const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hassan111';

async function debugQuizStatus() {
  console.log('🔍 Debugging Quiz Status...\n');

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
        name: 'Debug Test Quiz',
        questionCount: 5,
        questions: [
          {
            "id": "q1",
            "text": "What is 1 + 1?",
            "options": ["1", "2", "3", "4"],
            "correctAnswers": [{"option": 1, "points": 100}]
          },
          {
            "id": "q2",
            "text": "What is 2 + 2?",
            "options": ["2", "3", "4", "5"],
            "correctAnswers": [{"option": 2, "points": 100}]
          }
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

    // Step 2: Check quiz status after creation
    console.log('\n2. Checking quiz status after creation...');
    const quizRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/quiz-info`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (quizRes.ok) {
      const quizData = await quizRes.json();
      console.log('Quiz status:', {
        active: quizData.active,
        started: quizData.started,
        paused: quizData.paused
      });
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
    }

    // Step 4: Check quiz status after start
    console.log('\n4. Checking quiz status after start...');
    const quizRes2 = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/quiz-info`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (quizRes2.ok) {
      const quizData2 = await quizRes2.json();
      console.log('Quiz status after start:', {
        active: quizData2.active,
        started: quizData2.started,
        paused: quizData2.paused
      });
    }

    // Step 5: Set pause points
    console.log('\n5. Setting pause points...');
    const pauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ pausePoints: [1] })
    });
    
    if (pauseRes.ok) {
      console.log('✅ Pause points set');
    } else {
      console.log('❌ Failed to set pause points:', await pauseRes.text());
    }

    // Step 6: Check quiz status after pause
    console.log('\n6. Checking quiz status after pause...');
    const quizRes3 = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/quiz-info`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (quizRes3.ok) {
      const quizData3 = await quizRes3.json();
      console.log('Quiz status after pause:', {
        active: quizData3.active,
        started: quizData3.started,
        paused: quizData3.paused
      });
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

    // Step 8: Check quiz status after resume
    console.log('\n8. Checking quiz status after resume...');
    const quizRes4 = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/quiz-info`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (quizRes4.ok) {
      const quizData4 = await quizRes4.json();
      console.log('Quiz status after resume:', {
        active: quizData4.active,
        started: quizData4.started,
        paused: quizData4.paused
      });
    }

    // Step 9: Try to submit an answer
    console.log('\n9. Testing answer submission...');
    const submitRes = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_user',
        quizId: QUIZ_ID,
        questionId: 'q1',
        selectedOption: '1',
        questionStartTimestamp: Date.now() - 5000,
        responseTimeMs: 5000
      })
    });
    
    if (submitRes.ok) {
      console.log('✅ Answer submitted successfully');
    } else {
      const errorText = await submitRes.text();
      console.log('❌ Failed to submit answer:', submitRes.status, errorText);
    }

    // Step 10: Cleanup
    console.log('\n10. Cleaning up...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (deleteRes.ok) {
      console.log('✅ Test quiz deleted');
    } else {
      console.log('❌ Failed to delete test quiz:', await deleteRes.text());
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugQuizStatus(); 