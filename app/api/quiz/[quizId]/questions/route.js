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
  const client = await clientPromise;
  const db = client.db();
  const quizDoc = await db.collection('quizzes').findOne({ quizId });
  if (!quizDoc) {
    return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
  }
  const questions = quizDoc.questions || [];
  return new Response(JSON.stringify({ questions }), { status: 200 });
} 