import clientPromise from '@/lib/db.js';
import { z } from 'zod';

export async function GET(req, { params }) {
  try {
    const quizIdSchema = z.object({ quizId: z.string().min(1) });
    const awaitedParams = await params;
    const parseResult = quizIdSchema.safeParse(awaitedParams);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
    }
    const { quizId } = awaitedParams;
    
    // Get quiz info from database
    const client = await clientPromise;
    const db = client.db();
    
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    
    if (!quizDoc) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    // Format the creation time
    const createdAt = new Date(quizDoc.createdAt);
    const formattedTime = createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Only return quizId, name, questionCount, questions, and active
    const quizInfo = {
      id: quizDoc.quizId,
      name: quizDoc.name, // Use actual name from database
      questionCount: quizDoc.questionCount,
      active: quizDoc.active || false,
      createdAt: quizDoc.createdAt,
      formattedCreatedAt: formattedTime,
      createdBy: quizDoc.createdBy
    };
    
    return new Response(JSON.stringify(quizInfo), { status: 200 });
    
  } catch (error) {
    console.error('Quiz info error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 