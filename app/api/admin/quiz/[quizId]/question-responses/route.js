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
    
    // Get quiz information to determine the session start time
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    // Get the quiz start time to filter answers from this session only
    const quizStartTime = quiz.startedAt ? new Date(quiz.startedAt).getTime() : 0;
    
    // Get questions for this quiz
    const questions = quiz.questions || [];
    
    // Get all answers for this quiz (filtered by session)
    const allAnswers = await db.collection('answers').find({ quizId }).toArray();
    const answers = allAnswers.filter(answer => {
      return quizStartTime === 0 || (answer.serverTimestamp && answer.serverTimestamp >= quizStartTime);
    });
    
    // Get unique users who have answered
    const uniqueUsers = [...new Set(answers.map(a => a.userId))];
    
    // Calculate response data for each question
    const questionResponses = questions.map((question, index) => {
      const questionAnswers = answers.filter(a => a.questionId === question.id);
      const totalResponses = questionAnswers.length;
      
      // Calculate option distribution
      const optionCounts = {};
      questionAnswers.forEach(answer => {
        const optionIndex = answer.selectedOption;
        optionCounts[optionIndex] = (optionCounts[optionIndex] || 0) + 1;
      });
      
      // Calculate response rate and average response time
      const responseRate = uniqueUsers.length > 0 ? (totalResponses / uniqueUsers.length) * 100 : 0;
      
      // Calculate average response time with safeguards
      let averageResponseTime = 0;
      if (totalResponses > 0) {
        const totalTime = questionAnswers.reduce((sum, a) => {
          const responseTime = a.responseTimeMs || 0;
          // Cap response time at 60 seconds (60000ms) to prevent unrealistic values
          const cappedTime = Math.min(responseTime, 60000);
          return sum + cappedTime;
        }, 0);
        averageResponseTime = totalTime / totalResponses;
      }
      
      return {
        questionId: question.id,
        questionNumber: index + 1,
        questionText: question.text,
        totalResponses,
        optionCounts,
        responseRate: Math.round(responseRate),
        averageResponseTime: Math.round(averageResponseTime / 1000) // Convert to seconds
      };
    });
    
    // Calculate overall statistics
    const overallStats = {
      totalAnswers: answers.length,
      activeUsers: uniqueUsers.length,
      averageResponsesPerQuestion: questions.length > 0 ? Math.round(answers.length / questions.length) : 0,
      completionRate: questions.length > 0 ? Math.round((answers.length / (uniqueUsers.length * questions.length)) * 100) : 0
    };
    
    return new Response(JSON.stringify({
      quizId,
      questionResponses,
      overallStats,
      lastUpdated: Date.now()
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error fetching question responses:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 