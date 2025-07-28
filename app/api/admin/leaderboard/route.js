import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function GET(req, { params }) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId') || 'default';
    const round = searchParams.get('round');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const type = searchParams.get('type') || 'full'; // 'full' or 'round'

    const client = await clientPromise;
    const db = client.db();

    let leaderboardData;
    
    if (type === 'round' && round) {
      // Get round-specific leaderboard
      leaderboardData = await db.collection('roundLeaderboard').findOne({ 
        quizId, 
        round: parseInt(round) 
      });
    } else {
      // Get full quiz leaderboard
      leaderboardData = await db.collection('leaderboard').findOne({ quizId });
    }

    if (!leaderboardData) {
      return new Response(JSON.stringify({ 
        error: 'No leaderboard data found' 
      }), { status: 404 });
    }

    // Limit the number of entries
    const limitedEntries = leaderboardData.entries.slice(0, limit);

    return new Response(JSON.stringify({
      quizId,
      round: round ? parseInt(round) : null,
      type,
      entries: limitedEntries,
      stats: leaderboardData.stats,
      totalParticipants: leaderboardData.totalParticipants,
      evaluatedAt: leaderboardData.evaluatedAt,
      requestedLimit: limit,
      actualCount: limitedEntries.length
    }), { status: 200 });

  } catch (error) {
    console.error('Admin leaderboard error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function POST(req, { params }) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { quizId = 'default', round, limit = 10, type = 'full' } = body;

    const client = await clientPromise;
    const db = client.db();

    let leaderboardData;
    
    if (type === 'round' && round) {
      // Get round-specific leaderboard
      leaderboardData = await db.collection('roundLeaderboard').findOne({ 
        quizId, 
        round: parseInt(round) 
      });
    } else {
      // Get full quiz leaderboard
      leaderboardData = await db.collection('leaderboard').findOne({ quizId });
    }

    if (!leaderboardData) {
      return new Response(JSON.stringify({ 
        error: 'No leaderboard data found. Please evaluate the quiz/round first.' 
      }), { status: 404 });
    }

    // Limit the number of entries
    const limitedEntries = leaderboardData.entries.slice(0, limit);

    return new Response(JSON.stringify({
      quizId,
      round: round ? parseInt(round) : null,
      type,
      entries: limitedEntries,
      stats: leaderboardData.stats,
      totalParticipants: leaderboardData.totalParticipants,
      evaluatedAt: leaderboardData.evaluatedAt,
      requestedLimit: limit,
      actualCount: limitedEntries.length
    }), { status: 200 });

  } catch (error) {
    console.error('Admin leaderboard error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 