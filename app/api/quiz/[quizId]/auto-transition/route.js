import clientPromise from '@/lib/db.js';
import { getQuizInfo, getQuestionsForRound } from '@/lib/questions.js';

export async function POST(req, { params }) {
  try {
    const { quizId } = params;
    const client = await clientPromise;
    const db = client.db();
    
    // Get quiz info
    const quizInfo = getQuizInfo(quizId);
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    
    if (!quizDoc || !quizDoc.active) {
      return new Response(JSON.stringify({ error: 'Quiz is not active' }), { status: 400 });
    }
    
    const currentRound = quizDoc.currentRound;
    const questionsForCurrentRound = getQuestionsForRound(quizId, currentRound, quizInfo.questionsPerRound);
    
    // Count answers for current round
    const answerCount = await db.collection('answers').countDocuments({
      quizId,
      round: currentRound
    });
    
    // Get unique users who answered in current round
    const uniqueUsers = await db.collection('answers').distinct('userId', {
      quizId,
      round: currentRound
    });
    
    // Check if round is complete (all questions answered by at least one user)
    const isRoundComplete = answerCount >= questionsForCurrentRound.length;
    
    // Check if we should auto-pause (all questions answered by multiple users)
    const shouldAutoPause = uniqueUsers.length >= 2 && answerCount >= questionsForCurrentRound.length * uniqueUsers.length;
    
    let action = null;
    let nextRound = null;
    
    if (shouldAutoPause) {
      // Auto-pause current round
      await db.collection('quizzes').updateOne(
        { quizId },
        { 
          $set: { 
            paused: true,
            lastEvaluationTime: Date.now(),
            autoPausedAt: Date.now()
          }
        }
      );
      action = 'auto-paused';
    } else if (isRoundComplete && currentRound < quizInfo.totalRounds) {
      // Auto-advance to next round
      nextRound = currentRound + 1;
      await db.collection('quizzes').updateOne(
        { quizId },
        { 
          $set: { 
            currentRound: nextRound,
            paused: false,
            roundStartTime: Date.now(),
            autoAdvancedAt: Date.now()
          }
        }
      );
      action = 'auto-advanced';
    }
    
    return new Response(JSON.stringify({
      status: 'ok',
      action,
      currentRound,
      nextRound,
      isRoundComplete,
      shouldAutoPause,
      answerCount,
      uniqueUsers: uniqueUsers.length,
      questionsInRound: questionsForCurrentRound.length
    }), { status: 200 });
    
  } catch (error) {
    console.error('Auto transition error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 