import clientPromise from '@/lib/db.js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId') || 'default';
    const limit = parseInt(searchParams.get('limit')) || 10;

    const client = await clientPromise;
    const db = client.db();

    // Only get full quiz leaderboard
    const leaderboardData = await db.collection('leaderboard').findOne({ quizId });

    if (!leaderboardData) {
      return new Response(JSON.stringify({ error: 'No leaderboard data found' }), { status: 404 });
    }

    // Limit the number of entries
    const limitedEntries = leaderboardData.entries.slice(0, limit);

    return new Response(JSON.stringify({
      quizId,
      entries: limitedEntries,
      stats: leaderboardData.stats,
      totalParticipants: leaderboardData.totalParticipants,
      evaluatedAt: leaderboardData.evaluatedAt,
      requestedLimit: limit,
      actualCount: limitedEntries.length
    }), { status: 200 });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 