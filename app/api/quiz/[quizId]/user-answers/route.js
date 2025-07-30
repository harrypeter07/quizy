import clientPromise from '@/lib/db.js';
import { z } from 'zod';

export async function GET(req, { params }) {
  try {
    const quizIdSchema = z.object({ quizId: z.string().min(1) });
    const awaitedParams = await params;
    const parseResult = quizIdSchema.safeParse(awaitedParams);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
    }
    const { quizId } = awaitedParams;

    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get quiz to determine session start time
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }

    // Get the quiz start time to filter answers from this session only
    const quizStartTime = quiz.startedAt ? new Date(quiz.startedAt).getTime() : 0;

    // Get all answers for this user and quiz
    const allAnswers = await db.collection('answers').find({ 
      quizId, 
      userId 
    }).toArray();

    // Filter answers to only include those submitted after the quiz started (current session)
    const answers = allAnswers.filter(answer => {
      return quizStartTime === 0 || (answer.serverTimestamp && answer.serverTimestamp >= quizStartTime);
    });

    // Transform answers to match the expected format
    const formattedAnswers = answers.map(answer => ({
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      questionStartTimestamp: answer.questionStartTimestamp,
      responseTimeMs: answer.responseTimeMs || 0
    }));

    return new Response(JSON.stringify({
      quizId,
      userId,
      answers: formattedAnswers,
      totalAnswers: formattedAnswers.length
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching user answers:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 