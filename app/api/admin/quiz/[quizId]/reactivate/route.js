import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req, { params }) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

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
    
    // Reactivate the quiz by clearing the deactivated flag and updating creation time
    const updateResult = await db.collection('quizzes').updateOne(
      { quizId },
      { 
        $set: { 
          deactivated: false,
          reactivatedAt: Date.now(),
          createdAt: new Date(), // Make it appear as a new quiz
          updatedAt: Date.now()
        } 
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quiz reactivated successfully',
      quizId,
      reactivatedAt: Date.now()
    }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 