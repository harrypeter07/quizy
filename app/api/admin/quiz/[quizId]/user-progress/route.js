import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

import PauseManager from '@/lib/pauseManager.js';

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

    // Get all answers for this quiz
    const allAnswers = await db.collection('answers').find({ quizId }).toArray();
    
    // Get unique users
    const uniqueUsers = [...new Set(allAnswers.map(a => a.userId))];
    
    // Get pause points
    const pausePoints = PauseManager.getPausePoints(quizId);
    
    // Build detailed user progress
    const userProgressDetails = uniqueUsers.map(userId => {
      const userAnswers = allAnswers.filter(a => a.userId === userId);
      const answeredQuestions = userAnswers.map(a => {
        const qIndex = quiz.questions.findIndex(q => q.id === a.questionId);
        return qIndex + 1; // Convert to 1-indexed
      });
      
      const currentProgress = answeredQuestions.length > 0 ? Math.max(...answeredQuestions) : 0;
      const trackedProgress = PauseManager.getUserProgress(quizId, userId);
      
      // Check if user is blocked by pause points
      const nextPausePoint = pausePoints.find(point => point > currentProgress);
      const isBlocked = nextPausePoint && currentProgress >= nextPausePoint;
      const isAtPausePoint = pausePoints.includes(currentProgress);
      
      return {
        userId,
        currentProgress,
        trackedProgress,
        totalAnswers: userAnswers.length,
        answeredQuestions,
        isBlocked,
        isAtPausePoint,
        nextPausePoint,
        lastAnswerTime: userAnswers.length > 0 ? Math.max(...userAnswers.map(a => a.serverTimestamp)) : null
      };
    });

    // Sort by current progress (highest first)
    userProgressDetails.sort((a, b) => b.currentProgress - a.currentProgress);

    return new Response(JSON.stringify({
      quizId,
      totalUsers: uniqueUsers.length,
      pausePoints,
      userProgressDetails,
      blockedUsers: userProgressDetails.filter(u => u.isBlocked).length,
      usersAtPausePoints: userProgressDetails.filter(u => u.isAtPausePoint).length,
      lastUpdated: Date.now()
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 