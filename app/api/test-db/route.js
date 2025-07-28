import clientPromise from '../../lib/db.js';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Test basic database operations
    const collections = await db.listCollections().toArray();
    const quizCount = await db.collection('quizzes').countDocuments();
    
    return new Response(JSON.stringify({
      status: 'connected',
      collections: collections.map(c => c.name),
      quizCount,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Database test error:', err);
    return new Response(JSON.stringify({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 