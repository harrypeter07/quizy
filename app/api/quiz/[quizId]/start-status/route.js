import clientPromise from '@/lib/db.js';

export async function GET(req, { params }) {
  const { quizId } = await params;
  try {
    console.log(`[start-status] API called for quizId: ${quizId}`);
    const client = await clientPromise;
    const db = client.db();
    // Fetch from quizzes collection
    const quiz = await db.collection('quizzes').findOne({ quizId });
    
    if (!quiz || !quiz.active) {
      console.log(`[start-status] Quiz not active or not found for quizId: ${quizId}`);
      return new Response(JSON.stringify({ active: false }), { status: 200 });
    }
    
    // Ensure startedAt is a valid timestamp
    const startedAt = quiz.startedAt ? new Date(quiz.startedAt).getTime() : Date.now();
    const countdown = quiz.countdown || 5;
    
    console.log(`[start-status] Quiz is active. startedAt: ${startedAt}, countdown: ${countdown}`);
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
    console.error(`[start-status] Error for quizId ${quizId}:`, err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 