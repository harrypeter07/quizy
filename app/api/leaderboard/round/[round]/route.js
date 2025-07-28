import clientPromise from '@/lib/db.js';
import { getQuizInfo } from '@/lib/questions.js';
import { z } from 'zod';

export async function GET(req, { params }) {
  const roundSchema = z.object({ round: z.string().min(1) });
  const awaitedParams = await params;
  const parseResult = roundSchema.safeParse(awaitedParams);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid round number' }), { status: 400 });
  }
  const { round } = awaitedParams;
  
  const roundNumber = parseInt(round);
  const quizInfo = getQuizInfo('default'); // For now, hardcoded to default quiz
  
  if (roundNumber < 1 || roundNumber > quizInfo.totalRounds) {
    return new Response(JSON.stringify({ 
      error: `Round number must be between 1 and ${quizInfo.totalRounds}` 
    }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get round leaderboard data
    const roundLeaderboard = await db.collection('roundLeaderboard').findOne({ 
      quizId: 'default',
      round: roundNumber
    });
    
    if (!roundLeaderboard) {
      return new Response(JSON.stringify({ 
        error: 'Round leaderboard not found. Round may not have been evaluated yet.' 
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      round: roundNumber,
      entries: roundLeaderboard.entries || [],
      stats: roundLeaderboard.stats || {},
      evaluatedAt: roundLeaderboard.evaluatedAt,
      totalParticipants: roundLeaderboard.totalParticipants || 0
    }), { status: 200 });

  } catch (error) {
    console.error('Round leaderboard error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 