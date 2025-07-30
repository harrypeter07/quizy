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
    if (!quizDoc) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    // Check if THIS specific quiz is active
    if (!quizDoc.active || quizDoc.quizId !== quizId) {
      return new Response(JSON.stringify({ error: 'This quiz is not active' }), { status: 400 });
    }

    const questions = quizDoc.questions || [];
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      return new Response(JSON.stringify({ error: 'Question not found' }), { status: 404 });
    }

    // Check if answer already exists for this user and question
    const existingAnswer = await answers.findOne({ 
      userId, 
      quizId, 
      questionId 
    });

    if (existingAnswer) {
      // Update existing answer instead of creating duplicate
      const updateResult = await answers.updateOne(
        { userId, quizId, questionId },
        { 
          $set: {
            selectedOption,
            serverTimestamp,
            questionStartTimestamp,
            responseTimeMs: responseTimeMs || 0
          }
        }
      );
      
      return new Response(JSON.stringify({ 
        status: 'updated', 
        serverTimestamp,
        message: 'Answer updated successfully'
      }), { status: 200 });
    }

    // Insert new answer
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

  } catch (err) {
    console.error('Submit route error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 