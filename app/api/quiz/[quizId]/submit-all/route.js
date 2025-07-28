import clientPromise from '@/lib/db.js';
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
    
    // Prepare all answers for batch insertion
    const answersToInsert = answers.map(answer => ({
      userId,
      quizId,
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      questionStartTimestamp: answer.questionStartTimestamp,
      serverTimestamp: Date.now(),
      responseTimeMs: answer.responseTimeMs
    }));
    
    // Insert all answers in a single operation
    const result = await answersCollection.insertMany(answersToInsert);
    
    console.log(`Submitted ${result.insertedCount} answers for user ${userId} in quiz ${quizId}`);
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      submittedCount: result.insertedCount,
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
    
    return new Response(JSON.stringify({ 
      error: 'Server error',
      message: 'Failed to submit answers'
    }), { status: 500 });
  }
} 