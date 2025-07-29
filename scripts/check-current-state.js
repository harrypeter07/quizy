// Check current database state
// Usage: node scripts/check-current-state.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://hassanmansuri570:OCpN9zShy6iPs2fS@cluster0.192fyff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';
const QUIZ_ID = 'default';

async function checkCurrentState() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('🔍 CHECKING CURRENT DATABASE STATE');
    console.log('=' * 50);
    
    // Check answers
    const answers = await db.collection('answers').find({ quizId: QUIZ_ID }).toArray();
    console.log(`📊 Answers: ${answers.length} total`);
    
    if (answers.length > 0) {
      console.log(`   - Sample answer:`, answers[0]);
      console.log(`   - Unique user IDs: ${[...new Set(answers.map(a => a.userId))].length}`);
      console.log(`   - Sample user IDs:`, [...new Set(answers.map(a => a.userId))].slice(0, 5));
    }
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Users: ${users.length} total`);
    
    if (users.length > 0) {
      console.log(`   - Sample user:`, users[0]);
    }
    
    // Check validation reports
    const validationReports = await db.collection('validationReports').find({ quizId: QUIZ_ID }).toArray();
    console.log(`📋 Validation Reports: ${validationReports.length} total`);
    
    if (validationReports.length > 0) {
      const latest = validationReports[validationReports.length - 1];
      console.log(`   - Latest report: ${new Date(latest.timestamp).toLocaleString()}`);
      console.log(`   - Participants processed: ${latest.participants?.totalUsers || 0}`);
      console.log(`   - Issues found: ${latest.issues?.length || 0}`);
    }
    
    // Check leaderboard
    const leaderboard = await db.collection('leaderboard').find({ quizId: QUIZ_ID }).toArray();
    console.log(`🏆 Leaderboard: ${leaderboard.length} total`);
    
    if (leaderboard.length > 0) {
      console.log(`   - Latest leaderboard: ${new Date(leaderboard[0].evaluatedAt).toLocaleString()}`);
      console.log(`   - Participants: ${leaderboard[0].totalParticipants || 0}`);
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (answers.length === 0) {
      console.log('❌ No answers found - Run bulk-insert-answers.js');
    } else if (users.length === 0) {
      console.log('❌ No users found - Run check-and-fix-users.js');
    } else if (validationReports.length === 0) {
      console.log('❌ No validation reports - Use "Calculate Scores" in admin dashboard');
    } else {
      console.log('✅ Database looks good! Use "Load Leaderboard" in admin dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkCurrentState(); 