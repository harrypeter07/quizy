import clientPromise from '../../../../../../lib/db';

export async function GET(req, { params }) {
  const { quizId } = params;
  try {
    const client = await clientPromise;
    const db = client.db();
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz || !quiz.active) {
      return new Response(JSON.stringify({ active: false }), { status: 200 });
    }
    // Optionally, you can set a countdown (e.g., 5 seconds before quiz page)
    return new Response(
      JSON.stringify({ active: true, startedAt: quiz.startedAt, countdown: quiz.countdown || 5 }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 