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
    const client = await clientPromise;
    const db = client.db();
    
    // Get all users and answers for this quiz
    const users = await db.collection('users').find({}).toArray();
    const answers = await db.collection('answers').find({ quizId }).toArray();

    if (!users.length || !answers.length) {
      return new Response(JSON.stringify({
        error: 'No users or answers found for this quiz'
      }), { status: 404 });
    }
    
    // Get questions for this quiz
    const questions = getQuestions(quizId);
    
    // Validate data integrity
    const validationErrors = [];
    
    // Check for answers without required fields
    const invalidAnswers = answers.filter(a => !a.userId || !a.questionId || !a.selectedOption);
    if (invalidAnswers.length > 0) {
      validationErrors.push(`${invalidAnswers.length} answers missing required fields`);
      console.warn('Invalid answers found:', invalidAnswers);
    }
    
    // Check for answers with invalid response times
    const answersWithInvalidTime = answers.filter(a => 
      typeof a.responseTimeMs !== 'number' || isNaN(a.responseTimeMs) || a.responseTimeMs < 0
    );
    if (answersWithInvalidTime.length > 0) {
      validationErrors.push(`${answersWithInvalidTime.length} answers with invalid response times`);
      console.warn('Answers with invalid response times:', answersWithInvalidTime);
    }
    
    // Check for users without answers
    const usersWithoutAnswers = users.filter(u => !answers.some(a => a.userId === u.userId));
    if (usersWithoutAnswers.length > 0) {
      validationErrors.push(`${usersWithoutAnswers.length} users without any answers`);
      console.warn('Users without answers:', usersWithoutAnswers.map(u => u.userId));
    }
    
    if (validationErrors.length > 0) {
      console.warn('Data validation warnings:', validationErrors);
    }
    
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
            responseTimeMs: ans.responseTimeMs || (ans.serverTimestamp - ans.questionStartTimestamp) || 0
          }))
        });
      }
    }
    
    // Batch evaluate all users
    const evaluationResults = batchEvaluateUsers(usersData, questions);
    
    // Calculate evaluation statistics
    const stats = calculateEvaluationStats(evaluationResults);
    
    // Prepare leaderboard entries with detailed information
    const leaderboardEntries = evaluationResults.map((result, index) => ({
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
    
    // Store evaluation results
    const evaluationData = {
      quizId,
      entries: leaderboardEntries,
      stats,
      evaluatedAt: Date.now(),
      totalParticipants: evaluationResults.length,
      evaluationDetails: {
        questionsEvaluated: questions.length,
        totalAnswersProcessed: answers.length,
        scoringMethod: 'multi-tier with time bonus'
      }
    };
    
    await db.collection('leaderboard').updateOne(
      { quizId },
      { $set: evaluationData },
      { upsert: true }
    );
    
    // Store a summary in validationReports for audit
    await db.collection('validationReports').insertOne({
      quizId,
      timestamp: new Date(),
      evaluation: {
        totalParticipants: evaluationResults.length,
        totalAnswers: answers.length,
        totalQuestions: questions.length,
        stats,
        entries: leaderboardEntries.map(e => ({
          userId: e.userId,
          displayName: e.displayName,
          score: e.score,
          accuracy: e.accuracy,
          averageResponseTime: e.averageResponseTime
        }))
      }
    });
    
    // Automatically stop the quiz after evaluation
    await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          active: false, 
          stoppedAt: Date.now(),
          evaluatedAt: Date.now(),
          evaluationCompleted: true
        }
      }
    );
    
    console.log(`[evaluate] Quiz ${quizId} automatically stopped after evaluation`);
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      leaderboard: leaderboardEntries,
      stats,
      totalEvaluated: evaluationResults.length,
      quizStopped: true
    }), { status: 200 });
    
  } catch (err) {
    console.error('Evaluation error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 