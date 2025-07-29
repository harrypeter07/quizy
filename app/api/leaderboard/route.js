import clientPromise from '@/lib/db.js';

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get the most recent quiz
    const recentQuiz = await db.collection('quizzes')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    
    if (!recentQuiz) {
      return new Response(JSON.stringify({ 
        error: 'No quiz found' 
      }), { status: 404 });
    }
    
    // Get leaderboard for the most recent quiz
    const leaderboardData = await db.collection('leaderboard').findOne({ 
      quizId: recentQuiz.quizId 
    });
    
    if (!leaderboardData) {
      return new Response(JSON.stringify({ 
        error: 'No leaderboard data found. Quiz may not have been evaluated yet.' 
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      quizId: recentQuiz.quizId,
      entries: leaderboardData.entries || [],
      stats: leaderboardData.stats || {},
      evaluatedAt: leaderboardData.evaluatedAt,
      totalParticipants: leaderboardData.totalParticipants || 0
    }), { status: 200 });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 