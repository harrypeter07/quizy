import clientPromise from '@/lib/db.js';
import { getQuizInfo } from '@/lib/questions.js';
import { z } from 'zod';

export async function GET(req, { params }) {
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
    
    // Get quiz status from database
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    
    if (!quizDoc) {
      return new Response(JSON.stringify({ 
        error: 'Quiz not found' 
      }), { status: 404 });
    }

    // Get quiz info for dynamic rounds
    const quizInfo = getQuizInfo(quizId);
    
    return new Response(JSON.stringify({
      quizId,
      currentRound: quizDoc.currentRound || 1,
      totalRounds: quizInfo.totalRounds,
      questionsPerRound: quizInfo.questionsPerRound,
      isActive: quizDoc.active || false,
      isPaused: quizDoc.paused || false,
      roundStartTime: quizDoc.roundStartTime || null,
      lastEvaluationTime: quizDoc.lastEvaluationTime || null
    }), { status: 200 });

  } catch (error) {
    console.error('Round status error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function POST(req, { params }) {
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const awaitedParams = await params;
  const parseResult = quizIdSchema.safeParse(awaitedParams);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = awaitedParams;

  try {
    const body = await req.json();
    const { action, round } = body;

    const client = await clientPromise;
    const db = client.db();

    if (action === 'start-round') {
      await db.collection('quizzes').updateOne(
        { quizId },
        { 
          $set: { 
            currentRound: round,
            active: true,
            paused: false,
            roundStartTime: Date.now()
          }
        },
        { upsert: true }
      );
    } else if (action === 'pause-round') {
      await db.collection('quizzes').updateOne(
        { quizId },
        { 
          $set: { 
            paused: true,
            lastEvaluationTime: Date.now()
          }
        }
      );
    } else if (action === 'resume-round') {
      await db.collection('quizzes').updateOne(
        { quizId },
        { 
          $set: { 
            paused: false,
            roundStartTime: Date.now()
          }
        }
      );
    }

    return new Response(JSON.stringify({ 
      status: 'ok',
      message: `Round ${action} successful`
    }), { status: 200 });

  } catch (error) {
    console.error('Round management error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 