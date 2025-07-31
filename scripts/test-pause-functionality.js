const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hassan111';

async function testPauseFunctionality() {
  console.log('🧪 Testing Pause Functionality...\n');

  let QUIZ_ID = null;

  try {
    // Step 0: Create a test quiz first
    console.log('0. Creating a test quiz...');
    const createQuizRes = await fetch(`${BASE_URL}/api/admin/quiz/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        name: 'Pause Test Quiz',
        questionCount: 10,
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
          },
          {
            "id": "q3",
            "text": "What is 3 + 3?",
            "options": ["3", "4", "5", "6"],
            "correctAnswers": [{"option": 3, "points": 100}]
          },
          {
            "id": "q4",
            "text": "What is 4 + 4?",
            "options": ["4", "5", "6", "8"],
            "correctAnswers": [{"option": 3, "points": 100}]
          },
          {
            "id": "q5",
            "text": "What is 5 + 5?",
            "options": ["5", "6", "7", "10"],
            "correctAnswers": [{"option": 3, "points": 100}]
          }
        ]
      })
    });

    if (createQuizRes.ok) {
      const createData = await createQuizRes.json();
      QUIZ_ID = createData.quizId;
      console.log('✅ Test quiz created:', QUIZ_ID);
    } else {
      console.log('❌ Failed to create test quiz:', await createQuizRes.text());
      return;
    }

    // Test 1: Set pause points
    console.log('\n1. Setting pause points at questions 2 and 4...');
    const setPauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ pausePoints: [2, 4] })
    });

    if (setPauseRes.ok) {
      const setPauseData = await setPauseRes.json();
      console.log('✅ Pause points set:', setPauseData);
    } else {
      console.log('❌ Failed to set pause points:', await setPauseRes.text());
    }

    // Test 2: Get pause points
    console.log('\n2. Getting pause points...');
    const getPauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (getPauseRes.ok) {
      const getPauseData = await getPauseRes.json();
      console.log('✅ Pause points retrieved:', getPauseData);
    } else {
      console.log('❌ Failed to get pause points:', await getPauseRes.text());
    }

    // Test 3: Check quiz status at different questions
    console.log('\n3. Checking quiz status at different questions...');
    for (let question = 1; question <= 5; question++) {
      const statusRes = await fetch(`${BASE_URL}/api/quiz/${QUIZ_ID}/status?question=${question}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        console.log(`   Q${question}: ${statusData.isPaused ? '⏸️ PAUSED' : '▶️ Active'}`);
      } else {
        console.log(`   Q${question}: ❌ Error - ${await statusRes.text()}`);
      }
    }

    // Test 4: Resume quiz
    console.log('\n4. Resuming quiz...');
    const resumeRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (resumeRes.ok) {
      const resumeData = await resumeRes.json();
      console.log('✅ Quiz resumed:', resumeData);
    } else {
      console.log('❌ Failed to resume quiz:', await resumeRes.text());
    }

    // Test 5: Verify pause points are cleared
    console.log('\n5. Verifying pause points are cleared...');
    const finalPauseRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/pause-points`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (finalPauseRes.ok) {
      const finalPauseData = await finalPauseRes.json();
      console.log('✅ Final pause points:', finalPauseData);
    } else {
      console.log('❌ Failed to get final pause points:', await finalPauseRes.text());
    }

    // Test 6: Clean up - Delete the test quiz
    console.log('\n6. Cleaning up test quiz...');
    const deleteRes = await fetch(`${BASE_URL}/api/admin/quiz/${QUIZ_ID}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });

    if (deleteRes.ok) {
      console.log('✅ Test quiz deleted');
    } else {
      console.log('❌ Failed to delete test quiz:', await deleteRes.text());
    }

    console.log('\n🎉 Pause functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPauseFunctionality(); 