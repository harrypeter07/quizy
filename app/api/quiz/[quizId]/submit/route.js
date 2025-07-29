import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const submissionSchema = z.object({
  userId: z.string().min(1),
  quizId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.string().min(1),
  questionStartTimestamp: z.number().int().positive(),
  responseTimeMs: z.number().int().positive().optional()
});

export async function POST(req) {
  try {
    const data = await req.json();
    const parsed = submissionSchema.safeParse(data);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    const { userId, quizId, questionId, selectedOption, questionStartTimestamp, responseTimeMs } = parsed.data;
    const serverTimestamp = Date.now();

    const client = await clientPromise;
    const db = client.db();
    const answers = db.collection('answers');

    // Fetch quiz and questions from the database
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    if (!quizDoc || !quizDoc.active) {
      return new Response(JSON.stringify({ error: 'Quiz is not active' }), { status: 400 });
    }
    const questions = quizDoc.questions || [];
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      return new Response(JSON.stringify({ error: 'Question not found' }), { status: 404 });
    }

    try {
      // Try to insert new answer (will fail if duplicate due to unique index)
      const answerDoc = {
        userId,
        quizId,
        questionId,
        selectedOption,
        serverTimestamp,
        questionStartTimestamp,
        responseTimeMs: responseTimeMs || 0
      };
      const result = await answers.insertOne(answerDoc);
      return new Response(JSON.stringify({ 
        status: 'ok', 
        serverTimestamp,
        insertedId: result.insertedId 
      }), { status: 201 });
    } catch (error) {
      // Check if it's a duplicate key error
      if (error.code === 11000) {
        return new Response(JSON.stringify({ 
          status: 'duplicate',
          message: 'Answer already submitted for this question'
        }), { status: 409 });
      }
      // Other database error
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save answer',
        details: error.message 
      }), { status: 500 });
    }
  } catch (err) {
    console.error('Submit route error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 