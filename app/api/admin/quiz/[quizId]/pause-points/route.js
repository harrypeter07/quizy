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

    // Get current pause points for this quiz
    const pausePoints = PauseManager.getPausePoints(quizId);
    
    // Get response progress for each question
    const questions = quiz.questions || [];
    const allAnswers = await db.collection('answers').find({ quizId }).toArray();
    
    const questionProgress = questions.map((question, index) => {
      const questionAnswers = allAnswers.filter(a => a.questionId === question.id);
      const responseCount = questionAnswers.length;
      const questionNumber = index + 1;
      const isPausePoint = pausePoints.includes(questionNumber);
      
      return {
        questionNumber,
        questionId: question.id,
        responseCount,
        isPausePoint,
        isPaused: isPausePoint && pausePoints.length > 0
      };
    });

    // Get all user progress for this quiz
    const allUserProgress = PauseManager.getAllUserProgress(quizId);
    
    // Get unique users who have answered questions
    const uniqueUsers = [...new Set(allAnswers.map(a => a.userId))];
    const userProgressSummary = uniqueUsers.map(userId => ({
      userId,
      currentProgress: PauseManager.getUserProgress(quizId, userId),
      totalAnswers: allAnswers.filter(a => a.userId === userId).length
    }));

    return new Response(JSON.stringify({
      quizId,
      pausePoints,
      questionProgress,
      userProgressSummary,
      isPaused: pausePoints.length > 0,
      totalUsers: uniqueUsers.length,
      lastUpdated: Date.now()
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error fetching pause points:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

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
    const body = await req.json();
    const { pausePoints } = body;

    if (!Array.isArray(pausePoints)) {
      return new Response(JSON.stringify({ error: 'pausePoints must be an array' }), { status: 400 });
    }

    // Enhanced validation for pause points
    const validPausePoints = pausePoints
      .filter(point => Number.isInteger(point) && point > 0)
      .sort((a, b) => a - b); // Sort in ascending order

    // Check for duplicate pause points
    const uniquePausePoints = [...new Set(validPausePoints)];
    if (uniquePausePoints.length !== validPausePoints.length) {
      return new Response(JSON.stringify({ 
        error: 'Duplicate pause points are not allowed' 
      }), { status: 400 });
    }

    // Store pause points in memory with enhanced validation
    const finalPausePoints = PauseManager.setPausePoints(quizId, validPausePoints);

    // Get current user progress to show what will be affected
    const allUserProgress = PauseManager.getAllUserProgress(quizId);

    return new Response(JSON.stringify({
      success: true,
      quizId,
      pausePoints: finalPausePoints,
      message: `Pause points set: ${finalPausePoints.join(', ')}`,
      affectedUsers: allUserProgress.length,
      userProgressSummary: allUserProgress
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error setting pause points:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
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
    // Get current user progress before clearing
    const allUserProgress = PauseManager.getAllUserProgress(quizId);
    
    // Clear pause points for this quiz
    PauseManager.clearPausePoints(quizId);

    return new Response(JSON.stringify({
      success: true,
      quizId,
      message: 'Pause points cleared',
      affectedUsers: allUserProgress.length,
      userProgressSummary: allUserProgress
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error clearing pause points:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 