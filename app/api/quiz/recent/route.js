import clientPromise from '@/lib/db.js';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Find the most recently started (active) quiz first
    let quiz = await db.collection('quizzes')
      .find({ active: true })
      .sort({ startedAt: -1 })
      .limit(1)
      .toArray();
    if (quiz.length === 0) {
      // If no active quiz, fall back to most recently created
      quiz = await db.collection('quizzes')
        .find({})
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
    }
    if (quiz.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No quizzes found' 
      }), { status: 404 });
    }
    const recentQuiz = quiz[0];
    
    // Format the creation time
    const createdAt = new Date(recentQuiz.createdAt);
    const formattedTime = createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Only return quizId, name, questionCount, questions, and active
    const responseData = {
      quizId: recentQuiz.quizId,
      name: recentQuiz.name,
      questionCount: recentQuiz.questionCount,
      active: recentQuiz.active,
      createdAt: recentQuiz.createdAt,
      formattedCreatedAt: formattedTime,
      createdBy: recentQuiz.createdBy
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    console.error('Error fetching recent quiz:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error' 
    }), { status: 500 });
  }
} 