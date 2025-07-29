// Upload a quiz with quizId 'default' and 15 questions to MongoDB
// Usage: node scripts/upload-default-quiz.js
// Edit MONGODB_URI and ADMIN_TOKEN below as needed

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://hassanmansuri570:OCpN9zShy6iPs2fS@cluster0.192fyff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // <-- CHANGE if needed
const DB_NAME = 'test'; // <-- CHANGE to your DB name
const ADMIN_TOKEN = 'your_admin_token'; // <-- CHANGE if you want to use it for API, not used in direct insert

const QUIZ_ID = 'default';
const QUIZ_NAME = 'Default Quiz';
const QUESTION_COUNT = 15;

// Generate 15 questions, each with 6 options and 3 correct answers (different scores)
function generateQuestions() {
  const questions = [];
  for (let i = 1; i <= QUESTION_COUNT; i++) {
    const qid = `q${i}`;
    const options = [];
    for (let j = 1; j <= 6; j++) {
      options.push(`Option ${j} for Q${i}`);
    }
    // Pick 3 correct answers: 1st, 3rd, 5th (indexes 0, 2, 4) with different points
    const correctAnswers = [
      { option: 0, points: 100 }, // primary
      { option: 2, points: 60 },  // secondary
      { option: 4, points: 30 }   // tertiary
    ];
    questions.push({
      id: qid,
      text: `Sample Question ${i}?`,
      options,
      correctAnswers
    });
  }
  return questions;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const quizzes = db.collection('quizzes');

  // Remove any existing quiz with quizId 'default'
  await quizzes.deleteMany({ quizId: QUIZ_ID });

  const questions = generateQuestions();
  const quizDoc = {
    quizId: QUIZ_ID,
    name: QUIZ_NAME,
    questionCount: questions.length,
    questions,
    active: true,
    quizIsStarted: false,
    createdAt: new Date(),
    createdBy: 'admin'
  };

  await quizzes.insertOne(quizDoc);
  console.log(`Quiz '${QUIZ_ID}' with ${questions.length} questions uploaded successfully.`);
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 