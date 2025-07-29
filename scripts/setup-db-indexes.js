const { MongoClient } = require('mongodb');

async function setupDatabaseIndexes() {
  console.log('=== SETTING UP DATABASE INDEXES FOR HIGH CONCURRENCY ===');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 100,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Create indexes for optimal performance with 1000+ concurrent users

    // 1. Answers collection indexes
    console.log('\n1. Setting up answers collection indexes...');
    const answersCollection = db.collection('answers');
    
    // Unique compound index for preventing duplicate submissions
    await answersCollection.createIndex(
      { userId: 1, quizId: 1, questionId: 1 },
      { unique: true, name: 'unique_user_quiz_question' }
    );
    
    // Index for querying answers by quiz and round
    await answersCollection.createIndex(
      { quizId: 1, round: 1 },
      { name: 'quiz_round_index' }
    );
    
    // Index for querying answers by user
    await answersCollection.createIndex(
      { userId: 1 },
      { name: 'user_index' }
    );
    
    // Index for timestamp-based queries
    await answersCollection.createIndex(
      { serverTimestamp: 1 },
      { name: 'timestamp_index' }
    );

    // 2. Quizzes collection indexes
    console.log('\n2. Setting up quizzes collection indexes...');
    const quizzesCollection = db.collection('quizzes');
    
    // Index for quiz lookup by quizId
    await quizzesCollection.createIndex(
      { quizId: 1 },
      { unique: true, name: 'quiz_id_unique' }
    );
    
    // Index for active quizzes
    await quizzesCollection.createIndex(
      { active: 1 },
      { name: 'active_quiz_index' }
    );

    // 3. Users collection indexes
    console.log('\n3. Setting up users collection indexes...');
    const usersCollection = db.collection('users');
    
    // Index for user lookup by userId
    await usersCollection.createIndex(
      { userId: 1 },
      { unique: true, name: 'user_id_unique' }
    );
    
    // Index for creation time queries
    await usersCollection.createIndex(
      { createdAt: 1 },
      { name: 'user_created_at_index' }
    );

    // 4. Leaderboard collection indexes (if exists)
    console.log('\n4. Setting up leaderboard collection indexes...');
    const leaderboardCollection = db.collection('leaderboard');
    
    // Index for leaderboard queries
    await leaderboardCollection.createIndex(
      { quizId: 1, round: 1 },
      { name: 'leaderboard_quiz_round_index' }
    );
    
    await leaderboardCollection.createIndex(
      { score: -1 },
      { name: 'leaderboard_score_index' }
    );

    console.log('\n✅ All database indexes created successfully!');
    console.log('\nIndexes created:');
    console.log('- answers: unique_user_quiz_question, quiz_round_index, user_index, timestamp_index');
    console.log('- quizzes: quiz_id_unique, active_quiz_index');
    console.log('- users: user_id_unique, user_created_at_index');
    console.log('- leaderboard: leaderboard_quiz_round_index, leaderboard_score_index');
    
    console.log('\nThese indexes will optimize performance for:');
    console.log('- 1000+ concurrent user submissions');
    console.log('- Real-time leaderboard queries');
    console.log('- User activity tracking');
    console.log('- Quiz status monitoring');

  } catch (error) {
    console.error('Error setting up database indexes:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the setup
setupDatabaseIndexes(); 