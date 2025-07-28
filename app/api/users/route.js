import clientPromise from '@lib/db';

export async function POST(req) {
  try {
    const { userId, displayName } = await req.json();
    if (!userId || !displayName) {
      return new Response(JSON.stringify({ error: 'Missing userId or displayName' }), { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    await db.collection('users').updateOne(
      { userId },
      { $set: { userId, displayName } },
      { upsert: true }
    );
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 