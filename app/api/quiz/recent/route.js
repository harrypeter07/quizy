import clientPromise from '@/lib/db.js';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Find the most recently created quiz
    const recentQuiz = await db.collection('quizzes')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (recentQuiz.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No quizzes found' 
      }), { status: 404 });
    }

    const quiz = recentQuiz[0];
    
    // Format the creation time
    const createdAt = new Date(quiz.createdAt);
    const formattedTime = createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const responseData = {
      quizId: quiz.quizId,
      name: quiz.name,
      questionCount: quiz.questionCount,
      totalRounds: quiz.totalRounds,
      questionsPerRound: quiz.questionsPerRound,
      active: quiz.active,
      currentRound: quiz.currentRound,
      paused: quiz.paused,
      createdAt: quiz.createdAt,
      formattedCreatedAt: formattedTime,
      createdBy: quiz.createdBy
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    console.error('Error fetching recent quiz:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error' 
    }), { status: 500 });
  }
} 