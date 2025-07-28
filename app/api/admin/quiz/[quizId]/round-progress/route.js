import clientPromise from '@/lib/db.js';
import { getQuizInfo, getQuestionsForRound } from '@/lib/questions.js';
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
    const { searchParams } = new URL(req.url);
    const round = parseInt(searchParams.get('round')) || 1;
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get quiz info
    const quizInfo = getQuizInfo(quizId);
    
    if (round < 1 || round > quizInfo.totalRounds) {
      return new Response(JSON.stringify({ 
        error: `Invalid round number. Must be between 1 and ${quizInfo.totalRounds}` 
      }), { status: 400 });
    }
    
    // Get questions for this round
    const questionsForRound = getQuestionsForRound(quizId, round, quizInfo.questionsPerRound);
    
    // Get all answers for this round
    const answers = await db.collection('answers').find({ 
      quizId,
      round: round
    }).toArray();
    
    // Get unique users who answered in this round
    const uniqueUsers = await db.collection('answers').distinct('userId', {
      quizId,
      round: round
    });
    
    // Calculate progress for each question
    const questionProgress = questionsForRound.map(question => {
      const questionAnswers = answers.filter(a => a.questionId === question.id);
      const uniqueUsersForQuestion = [...new Set(questionAnswers.map(a => a.userId))];
      
      return {
        questionId: question.id,
        questionText: question.text,
        totalAnswers: questionAnswers.length,
        uniqueUsersAnswered: uniqueUsersForQuestion.length,
        usersAnswered: uniqueUsersForQuestion,
        answerDistribution: questionAnswers.reduce((acc, answer) => {
          acc[answer.selectedOption] = (acc[answer.selectedOption] || 0) + 1;
          return acc;
        }, {}),
        averageResponseTime: questionAnswers.length > 0 
          ? questionAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) / questionAnswers.length 
          : 0
      };
    });
    
    // Calculate round statistics
    const roundStats = {
      totalQuestions: questionsForRound.length,
      totalAnswers: answers.length,
      uniqueUsers: uniqueUsers.length,
      completionPercentage: Math.round((answers.length / (questionsForRound.length * uniqueUsers.length)) * 100) || 0,
      averageAnswersPerQuestion: Math.round(answers.length / questionsForRound.length) || 0,
      questionsWithAnswers: questionProgress.filter(q => q.totalAnswers > 0).length,
      questionsWithoutAnswers: questionProgress.filter(q => q.totalAnswers === 0).length
    };
    
    // Get user progress for this round
    const userProgress = uniqueUsers.map(userId => {
      const userAnswers = answers.filter(a => a.userId === userId);
      const user = userAnswers[0]; // Get user info from first answer
      
      return {
        userId,
        displayName: user?.displayName || 'Unknown',
        uniqueId: user?.uniqueId || 'Unknown',
        questionsAnswered: userAnswers.length,
        totalQuestions: questionsForRound.length,
        completionPercentage: Math.round((userAnswers.length / questionsForRound.length) * 100),
        averageResponseTime: userAnswers.length > 0 
          ? userAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) / userAnswers.length 
          : 0,
        lastAnsweredAt: userAnswers.length > 0 
          ? Math.max(...userAnswers.map(a => a.serverTimestamp))
          : null
      };
    });
    
    return new Response(JSON.stringify({
      quizId,
      round,
      roundStats,
      questionProgress,
      userProgress,
      generatedAt: Date.now()
    }), { status: 200 });
    
  } catch (error) {
    console.error('Round progress error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 