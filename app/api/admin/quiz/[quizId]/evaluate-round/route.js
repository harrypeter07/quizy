import clientPromise from '@/lib/db.js';
import { batchEvaluateUsers, calculateEvaluationStats } from '@/lib/scoring.js';
import { getQuestions } from '@/lib/questions.js';
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
    const body = await req.json();
    const { round } = body;
    
    if (!round || round < 1 || round > 3) {
      return new Response(JSON.stringify({ error: 'Invalid round number' }), { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get questions for this round (5 questions per round)
    const allQuestions = getQuestions(quizId);
    const startIndex = (round - 1) * 5;
    const endIndex = startIndex + 5;
    const roundQuestions = allQuestions.slice(startIndex, endIndex);
    
    // Get answers for this specific round
    const answers = await db.collection('answers').find({ 
      quizId,
      round: round
    }).toArray();
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Evaluating round ${round} for quiz ${quizId}: ${users.length} users, ${answers.length} answers`);
    
    // Prepare user data for batch evaluation
    const usersData = [];
    for (const user of users) {
      const userAnswers = answers.filter(a => a.userId === user.userId);
      if (userAnswers.length > 0) {
        usersData.push({
          userId: user.userId,
          displayName: user.displayName,
          uniqueId: user.uniqueId,
          answers: userAnswers.map(ans => ({
            questionId: ans.questionId,
            selectedOption: ans.selectedOption,
            responseTimeMs: ans.responseTimeMs || 0
          }))
        });
      }
    }
    
    // Batch evaluate all users for this round
    const evaluationResults = batchEvaluateUsers(usersData, roundQuestions);
    
    // Calculate evaluation statistics
    const stats = calculateEvaluationStats(evaluationResults);
    
    // Get top 10 participants for this round
    const top10 = evaluationResults.slice(0, 10).map((result, index) => ({
      rank: index + 1,
      userId: result.userId,
      displayName: result.displayName,
      uniqueId: result.uniqueId,
      score: result.totalScore,
      accuracy: result.accuracy,
      averageResponseTime: result.averageResponseTime,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions
    }));
    
    // Store round evaluation results
    const roundEvaluationData = {
      quizId,
      round,
      entries: top10,
      stats,
      evaluatedAt: Date.now(),
      totalParticipants: evaluationResults.length,
      evaluationDetails: {
        questionsEvaluated: roundQuestions.length,
        totalAnswersProcessed: answers.length,
        scoringMethod: 'multi-tier with time bonus'
      }
    };
    
    await db.collection('roundLeaderboard').updateOne(
      { quizId, round },
      { $set: roundEvaluationData },
      { upsert: true }
    );
    
    console.log(`Round ${round} evaluation complete for quiz ${quizId}: ${evaluationResults.length} participants evaluated`);
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      round,
      top10,
      stats,
      totalEvaluated: evaluationResults.length,
      message: `Round ${round} evaluation complete. Top 10 participants identified.`
    }), { status: 200 });
    
  } catch (error) {
    console.error('Round evaluation error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 