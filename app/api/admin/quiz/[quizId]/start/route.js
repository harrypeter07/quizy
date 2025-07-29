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
    console.log(`[admin-start] Attempting to start quiz: ${quizId}`);
    const client = await clientPromise;
    const db = client.db();
    // This updates the quizzes collection
    
    // Get current timestamp for startedAt
    const startedAt = new Date();
    const roundStartTime = Date.now();
    
    // Ensure only one quiz is active at a time (optional, uncomment if needed)
    // await db.collection('quizzes').updateMany({}, { $set: { active: false } });

    // Update quiz status with proper timestamp and start first round
    const updateResult = await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          active: true, 
          paused: false,
          currentRound: 1,
          startedAt: startedAt,
          roundStartTime: roundStartTime,
          countdown: 5, // 5 second countdown before quiz starts
          stoppedAt: null // clear stoppedAt if present
        }
      }
    );
    const updatedQuiz = await db.collection('quizzes').findOne({ quizId });
    console.log('[admin-start] Updated quiz document:', updatedQuiz);
    console.log(`[admin-start] Quiz ${quizId} started successfully.`);

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
    console.error(`[admin-start] Start quiz error for quizId ${quizId}:`, error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 