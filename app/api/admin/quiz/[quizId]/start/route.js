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
    
    // Get current timestamp for startedAt
    const startedAt = new Date();
    const roundStartTime = Date.now();
    
    // Update quiz status with proper timestamp and start first round
    await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          active: true, 
          currentRound: 1,
          paused: false,
          startedAt: startedAt,
          roundStartTime: roundStartTime,
          countdown: 5 // 5 second countdown before quiz starts
        } 
      }
    );

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quiz started successfully with Round 1 active',
      quizId,
      currentRound: 1,
      startedAt: startedAt.getTime(),
      roundStartTime: roundStartTime,
      countdown: 5
    }), { status: 200 });
    
  } catch (error) {
    console.error('Start quiz error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 