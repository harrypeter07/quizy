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
    
    // Start the quiz by setting it as active
    await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          active: true,
          startedAt: Date.now(),
          currentRound: 1,
          paused: false
        }
      },
      { upsert: true }
    );
    
    console.log(`Quiz ${quizId} started by admin`);
    
    return new Response(JSON.stringify({ 
      status: 'ok',
      message: `Quiz ${quizId} started successfully`
    }), { status: 200 });
    
  } catch (error) {
    console.error('Start quiz error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 