import clientPromise from '@/lib/db.js';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get the most recent active quiz or default quiz
    const quiz = await db.collection('quizzes').findOne(
      { active: true },
      { sort: { createdAt: -1 } }
    ) || await db.collection('quizzes').findOne(
      { quizId: 'default' }
    ) || await db.collection('quizzes').findOne(
      {},
      { sort: { createdAt: -1 } }
    );
    
    if (!quiz) {
      return new Response(JSON.stringify({
        name: 'Sample Quiz',
        questionCount: 15,
        totalRounds: 3,
        active: false
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify({
      name: quiz.name || 'Quiz',
      questionCount: quiz.questionCount || 15,
      totalRounds: quiz.totalRounds || 3,
      active: quiz.active || false,
      currentRound: quiz.currentRound || 1
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error fetching quiz info:', error);
    return new Response(JSON.stringify({
      name: 'Quiz',
      questionCount: 15,
      totalRounds: 3,
      active: false
    }), { status: 200 });
  }
} 