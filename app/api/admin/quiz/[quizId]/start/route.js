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
    // console.log(`[admin-start] Attempting to start quiz: ${quizId}`);
    const client = await clientPromise;
    const db = client.db();
    // This updates the quizzes collection
    
    // Get current timestamp for startedAt
    const startedAt = new Date();
    
    // Update quiz status with proper timestamp and start first round
    const countdownStartAt = Date.now();
    
    // First check if the quiz was deactivated
    const existingQuiz = await db.collection('quizzes').findOne({ quizId });
    const wasDeactivated = existingQuiz?.deactivated || false;
    
    const updateResult = await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          active: true, 
          deactivated: false, // Clear the deactivated flag when starting
          startedAt: startedAt,
          stoppedAt: null,
          quizIsStarted: true,
          countdownStartAt,
          // If it was deactivated, update creation time to make it appear as new
          ...(wasDeactivated && {
            createdAt: new Date(),
            updatedAt: Date.now(),
            reactivatedAt: Date.now()
          })
        }
      }
    );
    const updatedQuiz = await db.collection('quizzes').findOne({ quizId });
    if (!updatedQuiz || !Array.isArray(updatedQuiz.questions) || updatedQuiz.questions.length === 0) {
      return new Response(JSON.stringify({ error: 'Quiz cannot be started without a valid question set.' }), { status: 400 });
    }
    // console.log('[admin-start] Updated quiz document:', updatedQuiz);
    // console.log(`[admin-start] Quiz ${quizId} started successfully.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quiz started successfully',
      quizId,
      startedAt: startedAt.getTime(),
      countdownStartAt
    }), { status: 200 });
    
  } catch (error) {
    console.error(`[admin-start] Start quiz error for quizId ${quizId}:`, error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 