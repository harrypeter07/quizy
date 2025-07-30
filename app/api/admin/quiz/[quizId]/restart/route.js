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
    console.log(`[admin-restart] Attempting to restart quiz: ${quizId}`);
    const client = await clientPromise;
    const db = client.db();
    
    // Get current timestamp for restart
    const restartedAt = new Date();
    
    // First, check if quiz exists and is active
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    if (!quiz.active) {
      return new Response(JSON.stringify({ error: 'Quiz must be active to restart' }), { status: 400 });
    }
    
    // Update quiz with restart timestamp and reset progress
    const updateResult = await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          deactivated: false, // Clear the deactivated flag when restarting
          restartedAt: restartedAt,
          lastRestartAt: restartedAt,
          currentQuestion: 0, // Reset to first question
          questionStartTime: null, // Reset question timer
          countdownStartAt: Date.now(), // Reset countdown
          // If it was deactivated, update creation time to make it appear as new
          ...(quiz.deactivated && {
            createdAt: new Date(),
            updatedAt: Date.now(),
            reactivatedAt: Date.now()
          })
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    // Clear all answers for this quiz (from main answers collection)
    const clearAnswersResult = await db.collection('answers').deleteMany({ quizId });
    console.log(`[admin-restart] Cleared ${clearAnswersResult.deletedCount} answers from main collection`);
    
    // Clear all user progress for this quiz
    const clearProgressResult = await db.collection('userAnswers').deleteMany({ quizId });
    console.log(`[admin-restart] Cleared progress for ${clearProgressResult.deletedCount} user answers`);
    
    // Clear user quiz progress
    const clearUserProgressResult = await db.collection('users').updateMany(
      { [`quizProgress.${quizId}`]: { $exists: true } },
      { 
        $unset: { [`quizProgress.${quizId}`]: "" },
        $set: { 
          [`quizProgress.${quizId}.currentQuestion`]: 0,
          [`quizProgress.${quizId}.startedAt`]: restartedAt,
          [`quizProgress.${quizId}.restartedAt`]: restartedAt
        }
      }
    );
    
    // Clear leaderboard entries for this quiz
    const clearLeaderboardResult = await db.collection('leaderboard').deleteMany({ quizId });
    console.log(`[admin-restart] Cleared ${clearLeaderboardResult.deletedCount} leaderboard entries`);
    
    // Clear any round-specific data
    const clearRoundDataResult = await db.collection('roundProgress').deleteMany({ quizId });
    console.log(`[admin-restart] Cleared ${clearRoundDataResult.deletedCount} round progress entries`);
    
    console.log(`[admin-restart] Quiz ${quizId} restarted successfully.`);
    console.log(`[admin-restart] - Cleared ${clearAnswersResult.deletedCount} answers from main collection`);
    console.log(`[admin-restart] - Cleared ${clearProgressResult.deletedCount} user answers`);
    console.log(`[admin-restart] - Cleared ${clearLeaderboardResult.deletedCount} leaderboard entries`);
    console.log(`[admin-restart] - Cleared ${clearRoundDataResult.deletedCount} round progress entries`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quiz restarted successfully',
      quizId,
      restartedAt: restartedAt.getTime(),
      clearedAnswers: clearAnswersResult.deletedCount,
      clearedUserAnswers: clearProgressResult.deletedCount,
      clearedLeaderboard: clearLeaderboardResult.deletedCount,
      clearedRoundData: clearRoundDataResult.deletedCount
    }), { status: 200 });
    
  } catch (error) {
    console.error(`[admin-restart] Restart quiz error for quizId ${quizId}:`, error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 