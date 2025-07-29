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
    
    // Get quiz questions
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    const questions = quiz.questions || [];
    
    // Get all answers for this quiz
    const answers = await db.collection('answers').find({ quizId }).toArray();
    
    // Calculate response counts per question
    const questionResponses = questions.map((question, index) => {
      const questionAnswers = answers.filter(a => a.questionId === question.id);
      const totalResponses = questionAnswers.length;
      
      // Count responses per option
      const optionCounts = {};
      question.options.forEach((option, optionIndex) => {
        optionCounts[optionIndex] = questionAnswers.filter(a => a.selectedOption === optionIndex.toString()).length;
      });
      
      return {
        questionNumber: index + 1,
        questionId: question.id,
        questionText: question.text,
        totalResponses,
        optionCounts,
        responseRate: totalResponses > 0 ? (totalResponses / answers.length * 100).toFixed(1) : 0,
        averageResponseTime: questionAnswers.length > 0 
          ? (questionAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) / questionAnswers.length / 1000).toFixed(1)
          : 0
      };
    });
    
    // Calculate overall statistics
    const totalAnswers = answers.length;
    const totalQuestions = questions.length;
    const totalUsers = await db.collection('users').countDocuments({});
    const activeUsers = await db.collection('users').countDocuments({ 
      [`quizProgress.${quizId}`]: { $exists: true } 
    });
    
    const overallStats = {
      totalAnswers,
      totalQuestions,
      totalUsers,
      activeUsers,
      averageResponsesPerQuestion: totalAnswers > 0 ? (totalAnswers / totalQuestions).toFixed(1) : 0,
      completionRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : 0
    };
    
    return new Response(JSON.stringify({
      quizId,
      questionResponses,
      overallStats,
      lastUpdated: new Date().toISOString()
    }), { status: 200 });
    
  } catch (error) {
    console.error(`[question-responses] Error fetching response data for ${quizId}:`, error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 