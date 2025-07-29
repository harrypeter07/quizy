import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

const createQuizSchema = z.object({
  name: z.string().min(1).max(100),
  questionCount: z.number().min(5).max(50)
});

export async function POST(req) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const data = await req.json();
    
    const parsed = createQuizSchema.safeParse(data);
    
    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return new Response(JSON.stringify({ error: 'Invalid input data' }), { status: 400 });
    }

    const { name, questionCount } = parsed.data;
    
    const client = await clientPromise;
    const db = client.db();

    // Generate a unique quiz ID
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create sample questions
    const questions = [];
    for (let i = 1; i <= questionCount; i++) {
      questions.push({
        id: `q_${quizId}_${i}`,
        text: `Sample Question ${i} - This is a placeholder question. You can replace this with actual questions.`,
        options: [
          'Option A - Sample answer',
          'Option B - Sample answer', 
          'Option C - Sample answer',
          'Option D - Sample answer'
        ],
        correctAnswer: 0 // Default to first option
      });
    }

    // Create quiz document (no round fields)
    const quizDoc = {
      quizId,
      name,
      questionCount,
      questions,
      active: false,
      quizIsStarted: false,
      createdAt: new Date(),
      createdBy: 'admin'
    };

    // Insert quiz into database
    await db.collection('quizzes').insertOne(quizDoc);

    // After creating the new quiz, disable all previous quizzes
    await db.collection('quizzes').updateMany({ quizId: { $ne: quizId } }, { $set: { active: false } });

    return new Response(JSON.stringify({
      success: true,
      quizId,
      message: `Quiz "${name}" created successfully with ${questionCount} questions.`
    }), { status: 201 });

  } catch (error) {
    console.error('Error creating quiz:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 