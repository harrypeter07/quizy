import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

import PauseManager from '@/lib/pauseManager.js';

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
    
    // Get quiz information
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }

    // Get current pause points
    const pausePoints = PauseManager.getPausePoints(quizId);
    
    if (pausePoints.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Quiz is not paused',
        quizId 
      }), { status: 200 });
    }

    // Get user progress before clearing pause points
    const allUserProgress = PauseManager.getAllUserProgress(quizId);
    
    // Clear pause points to resume the quiz
    PauseManager.clearPausePoints(quizId);

    // Update quiz with resume timestamp and ensure it's active
    await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          active: true, // Explicitly set quiz as active
          resumedAt: Date.now(),
          lastResumeAt: Date.now()
        }
      }
    );

    return new Response(JSON.stringify({
      success: true,
      quizId,
      message: 'Quiz resumed successfully',
      resumedAt: Date.now(),
      affectedUsers: allUserProgress.length,
      userProgressSummary: allUserProgress,
      clearedPausePoints: pausePoints
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error resuming quiz:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 