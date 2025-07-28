import clientPromise from '@/lib/db.js';

const adminToken = process.env.ADMIN_TOKEN;

export async function GET(req) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const users = await db.collection('users').find({}).toArray();
    
    return new Response(JSON.stringify({ users }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 