import clientPromise from '@/lib/db.js';
import { z } from 'zod';
import PauseManager from '@/lib/pauseManager.js';

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
    
    // Check if quiz is active
    if (!quizDoc.active) {
      return new Response(JSON.stringify({ error: 'This quiz is not active' }), { status: 400 });
    }

    const questions = quizDoc.questions || [];
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      return new Response(JSON.stringify({ error: 'Question not found' }), { status: 404 });
    }

    const questionNumber = questionIndex + 1; // Convert to 1-indexed
    
    // Enhanced pause point validation using PauseManager
    const validationResult = PauseManager.canUserAnswerQuestion(quizId, userId, questionNumber);
    
    if (!validationResult.allowed) {
      return new Response(JSON.stringify({ 
        error: validationResult.reason,
        isPaused: true,
        pausePoint: validationResult.pausePoint,
        nextPausePoint: validationResult.nextPausePoint,
        userProgress: validationResult.userProgress,
        allowedUpTo: validationResult.allowedUpTo
      }), { status: 400 });
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
      
      // Track user progress after successful answer
      PauseManager.trackUserProgress(quizId, userId, questionNumber);
      
      return new Response(JSON.stringify({ 
        status: 'updated', 
        serverTimestamp,
        message: 'Answer updated successfully',
        userProgress: PauseManager.getUserProgress(quizId, userId)
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
    
    // Track user progress after successful answer
    PauseManager.trackUserProgress(quizId, userId, questionNumber);
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      serverTimestamp,
      insertedId: result.insertedId,
      userProgress: PauseManager.getUserProgress(quizId, userId)
    }), { status: 201 });

  } catch (err) {
    console.error('Submit route error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 