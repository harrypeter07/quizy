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
    
    // Only return quizId, name, questionCount, questions, and active
    return new Response(
      JSON.stringify({ 
        quizId: quiz.quizId,
        name: quiz.name,
        questionCount: quiz.questionCount,
        questions: quiz.questions,
        active: quiz.active
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(`