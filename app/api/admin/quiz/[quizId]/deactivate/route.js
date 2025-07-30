import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req, { params }) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

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
    
    // Deactivate the quiz - set it to permanently inactive
    await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          quizId, 
          active: false, 
          deactivated: true,
          deactivatedAt: Date.now(),
          stoppedAt: Date.now() 
        } 
      },
      { upsert: true }
    );
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      message: 'Quiz deactivated successfully',
      deactivatedAt: Date.now() 
    }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 