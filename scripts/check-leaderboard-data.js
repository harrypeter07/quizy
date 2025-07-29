// Check leaderboard data in validation reports
// Usage: node scripts/check-leaderboard-data.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://hassanmansuri570:OCpN9zShy6iPs2fS@cluster0.192fyff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';
const QUIZ_ID = 'default';

async function checkLeaderboardData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('🔍 CHECKING LEADERBOARD DATA');
    console.log('=' * 50);
    
    // Check validation reports (where leaderboard data is stored)
    const validationReports = await db.collection('validationReports')
      .find({ quizId: QUIZ_ID })
      .sort({ timestamp: -1 })
      .toArray();
    
    console.log(`📋 Validation Reports: ${validationReports.length} total`);
    
    if (validationReports.length === 0) {
      console.log('❌ No validation reports found!');
      console.log('💡 Run "Calculate Scores" in admin dashboard first.');
      return;
    }
    
    const latestReport = validationReports[0];
    console.log(`📅 Latest report: ${new Date(latestReport.timestamp).toLocaleString()}`);
    
    if (latestReport.participants) {
      console.log(`👥 Participants processed: ${latestReport.participants.totalUsers}`);
      console.log(`🏆 Top 5 scores:`);
      
      if (latestReport.participants.userScores && latestReport.participants.userScores.length > 0) {
        latestReport.participants.userScores.slice(0, 5).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.displayName} - Score: ${user.score}, Accuracy: ${user.accuracy.toFixed(1)}%`);
        });
        
        console.log(`📊 Statistics:`);
        console.log(`   - Average Score: ${latestReport.participants.averageScore}`);
        console.log(`   - Highest Score: ${latestReport.participants.highestScore}`);
        console.log(`   - Lowest Score: ${latestReport.participants.lowestScore}`);
      } else {
        console.log('❌ No user scores found in latest report!');
      }
    } else {
      console.log('❌ No participants data in latest report!');
    }
    
    // Check old leaderboard collection
    const oldLeaderboard = await db.collection('leaderboard').find({ quizId: QUIZ_ID }).toArray();
    console.log(`\n🏆 Old Leaderboard Collection: ${oldLeaderboard.length} entries`);
    
    if (oldLeaderboard.length > 0) {
      console.log('⚠️ Old leaderboard data exists but is no longer used.');
      console.log('💡 The system now uses validationReports collection.');
    }
    
    console.log('\n💡 NEXT STEPS:');
    if (validationReports.length > 0 && latestReport.participants && latestReport.participants.userScores.length > 0) {
      console.log('✅ Leaderboard data exists! Use "Load Leaderboard" in admin dashboard.');
    } else {
      console.log('❌ No leaderboard data found. Run "Calculate Scores" in admin dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkLeaderboardData(); 