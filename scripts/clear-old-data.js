// Clear old/bad evaluation and validation data
// Usage: node scripts/clear-old-data.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://hassanmansuri570:OCpN9zShy6iPs2fS@cluster0.192fyff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';

async function clearOldData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('🗑️ Clearing old evaluation and validation data...');
    
    // Clear old leaderboard data
    const leaderboardResult = await db.collection('leaderboard').deleteMany({});
    console.log(`✅ Cleared ${leaderboardResult.deletedCount} leaderboard entries`);
    
    // Clear old validation reports
    const validationResult = await db.collection('validationReports').deleteMany({});
    console.log(`✅ Cleared ${validationResult.deletedCount} validation reports`);
    
    // Clear old round leaderboard data (if any)
    const roundLeaderboardResult = await db.collection('roundLeaderboard').deleteMany({});
    console.log(`✅ Cleared ${roundLeaderboardResult.deletedCount} round leaderboard entries`);
    
    console.log('\n🎉 Data cleanup completed!');
    console.log('💡 Now you can:');
    console.log('   1. Run the evaluation again using the admin dashboard');
    console.log('   2. Check that the results are properly stored in the leaderboard collection');
    console.log('   3. Verify that validation reports are created correctly');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await client.close();
  }
}

clearOldData(); 