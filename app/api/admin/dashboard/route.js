import clientPromise from '@/lib/db.js';

export async function GET(req) {
  const token = req.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Get all quizzes directly from database instead of questions.js
    const quizzes = await db.collection('quizzes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get statistics for each quiz
    const quizStats = await Promise.all(quizzes.map(async (quiz) => {
      const quizId = quiz.quizId;
      
      // Get user count for this quiz (users who joined after quiz creation)
      const quizCreatedAt = new Date(quiz.createdAt).getTime();
      const allUsers = await db.collection('users').find({}).toArray();
      const usersForThisQuiz = allUsers.filter(user => {
        const userJoinedAt = new Date(user.createdAt).getTime();
        return userJoinedAt >= quizCreatedAt;
      });
      const userCount = usersForThisQuiz.length;
      
      // Get answer count for this quiz
      const answerCount = await db.collection('answers').countDocuments({ quizId });
      
      // Get leaderboard for this quiz
      const leaderboard = await db.collection('leaderboard').findOne({ quizId });
      
      return {
        id: quiz.quizId,
        name: quiz.name, // Use actual name from database
        questionCount: quiz.questionCount,
        totalRounds: quiz.totalRounds,
        questionsPerRound: quiz.questionsPerRound,
        active: quiz.active || false,
        startedAt: quiz.startedAt || null,
        userCount,
        answerCount,
        leaderboard: leaderboard?.entries || [],
        evaluatedAt: leaderboard?.evaluatedAt || null,
        createdAt: quiz.createdAt
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