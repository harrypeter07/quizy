// Check and fix users in database
// Usage: node scripts/check-and-fix-users.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://hassanmansuri570:OCpN9zShy6iPs2fS@cluster0.192fyff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';
const QUIZ_ID = 'default';

function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

async function checkAndFixUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('🔍 Checking database state...');
    
    // Get all answers
    const answers = await db.collection('answers').find({ quizId: QUIZ_ID }).toArray();
    console.log(`📊 Total answers: ${answers.length}`);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Total users in DB: ${users.length}`);
    
    // Find unique user IDs from answers
    const uniqueUserIds = [...new Set(answers.map(a => a.userId))];
    console.log(`🎯 Unique user IDs in answers: ${uniqueUserIds.length}`);
    console.log(`📝 Sample user IDs:`, uniqueUserIds.slice(0, 10));
    
    // Find missing users
    const existingUserIds = users.map(u => u.userId);
    const missingUserIds = uniqueUserIds.filter(userId => !existingUserIds.includes(userId));
    
    console.log(`❌ Missing users: ${missingUserIds.length}`);
    
    if (missingUserIds.length > 0) {
      console.log(`📝 Sample missing user IDs:`, missingUserIds.slice(0, 10));
      
      // Create missing users
      const usersToCreate = missingUserIds.map(userId => ({
        userId: userId,
        displayName: `User ${userId}`,
        uniqueId: userId,
        createdAt: new Date()
      }));
      
      console.log(`➕ Creating ${usersToCreate.length} users...`);
      
      if (usersToCreate.length > 0) {
        const result = await db.collection('users').insertMany(usersToCreate, { ordered: false });
        console.log(`✅ Created ${result.insertedCount} users`);
      }
    } else {
      console.log(`✅ All users exist in database`);
    }
    
    // Final check
    const finalUsers = await db.collection('users').find({}).toArray();
    console.log(`🎉 Final user count: ${finalUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkAndFixUsers(); 