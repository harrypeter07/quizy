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
      // First try to get from leaderboard collection (new implementation)
      leaderboardData = await db.collection('leaderboard').findOne({ quizId });
      
      // If no leaderboard data found, try to get from validation reports as fallback
      if (!leaderboardData) {
        const validationReport = await db.collection('validationReports')
          .findOne(
            { quizId },
            { sort: { timestamp: -1 } } // Get the most recent validation report
          );
        
        if (validationReport && validationReport.evaluation) {
          // Transform validation report data to leaderboard format
          leaderboardData = {
            quizId: validationReport.quizId,
            entries: validationReport.evaluation.entries.map((user, index) => ({
              rank: index + 1,
              userId: user.userId,
              displayName: user.displayName,
              uniqueId: user.uniqueId,
              score: user.score,
              accuracy: user.accuracy,
              averageResponseTime: user.averageResponseTime,
              correctAnswers: user.correctAnswers,
              totalQuestions: user.totalQuestions
            })),
            stats: {
              totalParticipants: validationReport.evaluation.totalParticipants,
              averageScore: validationReport.evaluation.stats?.averageScore || 0,
              highestScore: validationReport.evaluation.stats?.highestScore || 0,
              lowestScore: validationReport.evaluation.stats?.lowestScore || 0,
              averageAccuracy: 0, // Will be calculated if needed
              averageResponseTime: 0 // Will be calculated if needed
            },
            totalParticipants: validationReport.evaluation.totalParticipants,
            evaluatedAt: validationReport.timestamp
          };
        }
      }
    }

    if (!leaderboardData) {
      return new Response(JSON.stringify({ 
        error: 'No leaderboard data found. Please run evaluation first.' 
      }), { status: 404 });
    }

    // Always respect the limit - show only the requested number of top users
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
      // First try to get from leaderboard collection (new implementation)
      leaderboardData = await db.collection('leaderboard').findOne({ quizId });
      
      // If no leaderboard data found, try to get from validation reports as fallback
      if (!leaderboardData) {
        const validationReport = await db.collection('validationReports')
          .findOne(
            { quizId },
            { sort: { timestamp: -1 } } // Get the most recent validation report
          );
        
        if (validationReport && validationReport.evaluation) {
          // Transform validation report data to leaderboard format
          leaderboardData = {
            quizId: validationReport.quizId,
            entries: validationReport.evaluation.entries.map((user, index) => ({
              rank: index + 1,
              userId: user.userId,
              displayName: user.displayName,
              uniqueId: user.uniqueId,
              score: user.score,
              accuracy: user.accuracy,
              averageResponseTime: user.averageResponseTime,
              correctAnswers: user.correctAnswers,
              totalQuestions: user.totalQuestions
            })),
            stats: {
              totalParticipants: validationReport.evaluation.totalParticipants,
              averageScore: validationReport.evaluation.stats?.averageScore || 0,
              highestScore: validationReport.evaluation.stats?.highestScore || 0,
              lowestScore: validationReport.evaluation.stats?.lowestScore || 0,
              averageAccuracy: 0, // Will be calculated if needed
              averageResponseTime: 0 // Will be calculated if needed
            },
            totalParticipants: validationReport.evaluation.totalParticipants,
            evaluatedAt: validationReport.timestamp
          };
        }
      }
    }

    if (!leaderboardData) {
      return new Response(JSON.stringify({ 
        error: 'No leaderboard data found. Please run evaluation first.' 
      }), { status: 404 });
    }

    // Always respect the limit - show only the requested number of top users
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