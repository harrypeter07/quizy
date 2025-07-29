// Bulk insert answers for 400 users × 15 questions into MongoDB
// Usage: node scripts/bulk-insert-answers.js
// Edit the MONGODB_URI and DB_NAME below as needed

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://hassanmansuri570:OCpN9zShy6iPs2fS@cluster0.192fyff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // <-- CHANGE if needed
const DB_NAME = 'test'; // <-- CHANGE to your DB name
const QUIZ_ID = 'default';

const questionIds = [
  "q1", "q2", "q3", "q4", "q5",
  "q6", "q7", "q8", "q9", "q10",
  "q11", "q12", "q13", "q14", "q15"
];
const optionsPerQuestion = [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8]; // All have 8 options

function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const answers = db.collection('answers');

  const now = Date.now();
  const docs = [];

  for (let u = 1; u <= 1000; u++) {
    const userId = `user${pad(u, 3)}`;
    for (let q = 0; q < 15; q++) {
      const questionId = questionIds[q];
      const selectedOption = Math.floor(Math.random() * optionsPerQuestion[q]).toString();
      const questionStartTimestamp = now - Math.floor(Math.random() * 1000000);
      const responseTimeMs = 1000 + Math.floor(Math.random() * 11000); // 1s to 12s
      const serverTimestamp = questionStartTimestamp + responseTimeMs;

      docs.push({
        userId,
        quizId: QUIZ_ID,
        questionId,
        selectedOption,
        serverTimestamp,
        questionStartTimestamp,
        responseTimeMs
      });
    }
  }

  const result = await answers.insertMany(docs, { ordered: false });
  console.log(`Inserted ${result.insertedCount} answers for 400 users.`);
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 