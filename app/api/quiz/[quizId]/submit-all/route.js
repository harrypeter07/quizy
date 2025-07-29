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
      return {
        userId,
        quizId,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        questionStartTimestamp: answer.questionStartTimestamp,
        serverTimestamp: Date.now(),
        responseTimeMs: answer.responseTimeMs
      };
    });
    
    // Use ordered: false to continue processing even if some documents fail
    const result = await answersCollection.insertMany(answersToInsert, { ordered: false });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'All answers submitted successfully',
      totalAttempted: answers.length,
      insertedCount: result.insertedCount,
      acknowledgedCount: result.acknowledgedCount
    }), { status: 200 });
    
  } catch (error) {
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
    
    console.error('Submit-all route error:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error',
      message: 'Failed to submit answers'
    }), { status: 500 });
  }
} 