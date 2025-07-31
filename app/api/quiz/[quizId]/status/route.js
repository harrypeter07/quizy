import clientPromise from '@/lib/db.js';
import { z } from 'zod';

import PauseManager from '@/lib/pauseManager.js';

export async function GET(req, { params }) {
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const awaitedParams = await params;
  const parseResult = quizIdSchema.safeParse(awaitedParams);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = awaitedParams;

  // Get current question from query params
  const { searchParams } = new URL(req.url);
  const currentQuestion = parseInt(searchParams.get('question') || '0');

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
    
    // Check if current question is a pause point
    const isPaused = pausePoints.includes(currentQuestion);
    const nextPausePoint = pausePoints.find(point => point > currentQuestion);
    
    // Get response count for current question
    let responseCount = 0;
    if (currentQuestion > 0 && quiz.questions && quiz.questions[currentQuestion - 1]) {
      const currentQuestionId = quiz.questions[currentQuestion - 1].id;
      const answers = await db.collection('answers').find({ 
        quizId, 
        questionId: currentQuestionId 
      }).toArray();
      responseCount = answers.length;
    }

    return new Response(JSON.stringify({
      quizId,
      active: quiz.active,
      currentQuestion,
      isPaused,
      pausePoints,
      nextPausePoint,
      responseCount,
      totalQuestions: quiz.questions?.length || 0,
      lastUpdated: Date.now()
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error checking quiz status:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 