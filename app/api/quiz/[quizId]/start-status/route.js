import clientPromise from '@/lib/db.js';

export async function GET(req, { params }) {
  const { quizId } = await params;
  try {
    const client = await clientPromise;
    const db = client.db();
    const quiz = await db.collection('quizzes').findOne({ quizId });
    
    if (!quiz || !quiz.active) {
      return new Response(JSON.stringify({ active: false }), { status: 200 });
    }
    
    // Ensure startedAt is a valid timestamp
    const startedAt = quiz.startedAt ? new Date(quiz.startedAt).getTime() : Date.now();
    const countdown = quiz.countdown || 5;
    
    return new Response(
      JSON.stringify({ 
        active: true, 
        startedAt: startedAt, 
        countdown: countdown,
        currentRound: quiz.currentRound || 1,
        totalRounds: quiz.totalRounds || 1
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Start status error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 