import clientPromise from '@/lib/db.js';
import { getQuizInfo, getCurrentRound } from '@/lib/questions.js';
import { z } from 'zod';

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.string(),
  questionStartTimestamp: z.number().int().positive(),
  responseTimeMs: z.number().int().positive()
});

const submitAllSchema = z.object({
  userId: z.string().min(1),
  quizId: z.string().min(1),
  answers: z.array(answerSchema).min(1)
});

export async function POST(req, { params }) {
  try {
    const body = await req.json();
    const { userId, quizId, answers } = submitAllSchema.parse(body);
    
    const client = await clientPromise;
    const db = client.db();
    const answersCollection = db.collection('answers');
    
    // Get quiz info to calculate rounds
    const quizInfo = getQuizInfo(quizId);
    const questions = quizInfo.questions;
    
    // Prepare all answers for batch insertion with round information
    const answersToInsert = answers.map(answer => {
      const questionIndex = questions.findIndex(q => q.id === answer.questionId);
      const round = questionIndex >= 0 ? getCurrentRound(questionIndex, quizInfo.questionsPerRound) : 1;
      
      return {
        userId,
        quizId,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        questionStartTimestamp: answer.questionStartTimestamp,
        serverTimestamp: Date.now(),
        responseTimeMs: answer.responseTimeMs,
        round
      };
    });
    
    // Use ordered: false to continue processing even if some documents fail
    const result = await answersCollection.insertMany(answersToInsert, { ordered: false });
    
    console.log(`Submitted ${result.insertedCount} answers for user ${userId} in quiz ${quizId}`);
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      submittedCount: result.insertedCount,
      totalAttempted: answersToInsert.length,
      message: 'All answers submitted successfully'
    }), { status: 201 });
    
  } catch (error) {
    console.error('Batch submission error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid input data',
        details: error.errors
      }), { status: 400 });
    }
    
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      return new Response(JSON.stringify({ 
        status: 'partial_success',
        message: 'Some answers were already submitted. New answers have been saved.',
        submittedCount: error.insertedDocs?.length || 0
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Server error',
      message: 'Failed to submit answers'
    }), { status: 500 });
  }
} 