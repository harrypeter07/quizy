import clientPromise from '../../../../lib/db.js';
import { getAllQuizzes } from '../../../../lib/questions.js';

export async function GET(req) {
  const token = req.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Get all quizzes from questions data
    const quizzes = getAllQuizzes();
    
    // Get statistics for each quiz
    const quizStats = await Promise.all(quizzes.map(async (quiz) => {
      const quizId = quiz.id;
      
      // Get quiz status from database
      const quizDoc = await db.collection('quizzes').findOne({ quizId });
      
      // Get user count for this quiz
      const userCount = await db.collection('users').countDocuments();
      
      // Get answer count for this quiz
      const answerCount = await db.collection('answers').countDocuments({ quizId });
      
      // Get leaderboard for this quiz
      const leaderboard = await db.collection('leaderboard').findOne({ quizId });
      
      return {
        ...quiz,
        active: quizDoc?.active || false,
        startedAt: quizDoc?.startedAt || null,
        userCount,
        answerCount,
        leaderboard: leaderboard?.entries || [],
        evaluatedAt: leaderboard?.evaluatedAt || null
      };
    }));

    // Get overall statistics
    const totalUsers = await db.collection('users').countDocuments();
    const totalAnswers = await db.collection('answers').countDocuments();
    const activeQuizzes = quizStats.filter(q => q.active).length;
    const totalQuizzes = quizStats.length;

    return new Response(JSON.stringify({
      quizStats,
      overallStats: {
        totalUsers,
        totalAnswers,
        activeQuizzes,
        totalQuizzes
      }
    }), { status: 200 });

  } catch (err) {
    console.error('Dashboard error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 