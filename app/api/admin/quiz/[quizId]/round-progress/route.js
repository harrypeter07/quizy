import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function GET(req, { params }) {
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

    const currentRound = quiz.currentRound || 1;
    const roundStartTime = quiz.roundStartTime;
    const isActive = quiz.active || false;
    const isPaused = quiz.paused || false;

    // Get all users for this quiz
    const users = await db.collection('users').find({ 
      quizId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).toArray();

    // Get answers for current round
    const answers = await db.collection('answers').find({
      quizId,
      round: currentRound
    }).toArray();

    // Calculate completion statistics
    const totalUsers = users.length;
    const usersWithAnswers = new Set(answers.map(a => a.userId)).size;
    const completionPercentage = totalUsers > 0 ? Math.round((usersWithAnswers / totalUsers) * 100) : 0;

    // Calculate round duration
    const roundDuration = roundStartTime ? Math.floor((Date.now() - roundStartTime) / 1000) : 0;
    const roundDurationMinutes = Math.floor(roundDuration / 60);
    const roundDurationSeconds = roundDuration % 60;

    // Determine round status
    let roundStatus = 'inactive';
    if (isActive && !isPaused) {
      roundStatus = 'active';
    } else if (isActive && isPaused) {
      roundStatus = 'paused';
    } else if (!isActive && completionPercentage >= 90) {
      roundStatus = 'completed';
    }

    // Format round start time
    const roundStartTimeFormatted = roundStartTime ? new Date(roundStartTime).toLocaleString() : 'Not started';

    return new Response(JSON.stringify({
      quizId,
      currentRound,
      roundStatus,
      roundStartTime: roundStartTime,
      roundStartTimeFormatted,
      roundDuration,
      roundDurationFormatted: `${roundDurationMinutes}m ${roundDurationSeconds}s`,
      totalUsers,
      usersWithAnswers,
      completionPercentage,
      isActive,
      isPaused,
      canEvaluate: completionPercentage >= 80 && roundStatus === 'active', // Can evaluate if 80%+ completed
      evaluationReady: completionPercentage >= 90 || roundStatus === 'completed' // Ready for evaluation if 90%+ completed
    }), { status: 200 });

  } catch (error) {
    console.error('Round progress error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 