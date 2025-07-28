import clientPromise from '../../../lib/db';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    // Get the most recent leaderboard
    const leaderboard = await db.collection('leaderboard')
      .find()
      .sort({ evaluatedAt: -1 })
      .limit(1)
      .toArray();
    if (!leaderboard.length) {
      return new Response(JSON.stringify({ entries: [] }), { status: 200 });
    }
    return new Response(JSON.stringify({ entries: leaderboard[0].entries }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 