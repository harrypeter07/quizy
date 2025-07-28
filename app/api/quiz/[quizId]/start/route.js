import clientPromise from '../../../../lib/db';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req, { params }) {
  // Simple token check (improve later)
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const parseResult = quizIdSchema.safeParse(params);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = params;
  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection('quizzes').updateOne(
      { quizId },
      { $set: { quizId, active: true, startedAt: Date.now() } },
      { upsert: true }
    );
    return new Response(JSON.stringify({ status: 'ok', startedAt: Date.now() }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 