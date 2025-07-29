import clientPromise from '@/lib/db.js';
import { getQuizInfo, getCurrentRound } from '@/lib/questions.js';
import { z } from 'zod';

const submissionSchema = z.object({
  userId: z.string().min(1),
  quizId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.string().min(1),
  questionStartTimestamp: z.number().int().positive(),
  responseTimeMs: z.number().int().positive().optional(),
  round: z.number().int().positive().optional()
});

export async function POST(req) {
  try {
    const data = await req.json();
    const parsed = submissionSchema.safeParse(data);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    
    const { userId, quizId, questionId, selectedOption, questionStartTimestamp, responseTimeMs, round } = parsed.data;
    const serverTimestamp = Date.now();
    
    const client = await clientPromise;
    const db = client.db();
    const answers = db.collection('answers');
    
    // Get quiz info and validate round
    const quizInfo = getQuizInfo(quizId);
    const questions = quizInfo.questions;
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      return new Response(JSON.stringify({ error: 'Question not found' }), { status: 404 });
    }
    
    // Calculate expected round for this question
    const expectedRound = getCurrentRound(questionIndex, quizInfo.questionsPerRound);
    
    // Validate that the submitted round matches the expected round
    if (round && round !== expectedRound) {
      return new Response(JSON.stringify({ 
        error: `Invalid round. Question ${questionId} belongs to round ${expectedRound}, not round ${round}` 
      }), { status: 400 });
    }
    
    // Check if quiz is active and current round matches
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    
    if (!quizDoc || !quizDoc.active) {
      return new Response(JSON.stringify({ error: 'Quiz is not active' }), { status: 400 });
    }
    
    if (quizDoc.currentRound !== expectedRound) {
      return new Response(JSON.stringify({ 
        error: `Round ${expectedRound} is not currently active. Current active round is ${quizDoc.currentRound}` 
      }), { status: 400 });
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
        responseTimeMs: responseTimeMs || 0,
        round: expectedRound
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