import clientPromise from '@/lib/db.js';
import { z } from 'zod';

export async function GET(req, { params }) {
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const awaitedParams = await params;
  const parseResult = quizIdSchema.safeParse(awaitedParams);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = awaitedParams;

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const quiz = await db.collection('quizzes').findOne({ quizId });
    
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({
      quizId: quiz.quizId,
      name: quiz.name,
      active: quiz.active,
      startedAt: quiz.startedAt,
      stoppedAt: quiz.stoppedAt,
      restartedAt: quiz.restartedAt,
      lastRestartAt: quiz.lastRestartAt,
      currentQuestion: quiz.currentQuestion,
      questionCount: quiz.questions?.length || 0,
      countdownStartAt: quiz.countdownStartAt
    }), { status: 200 });
    
  } catch (error) {
    console.error(`[quiz-info] Error fetching quiz info for ${quizId}:`, error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 