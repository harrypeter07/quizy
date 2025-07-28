import { getQuestions } from '../../../../../../lib/questions';
import { z } from 'zod';

export async function GET(req, { params }) {
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const parseResult = quizIdSchema.safeParse(params);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = params;
  const questions = getQuestions(quizId);
  return new Response(JSON.stringify({ questions }), { status: 200 });
} 