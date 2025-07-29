import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

const createQuizSchema = z.object({
  name: z.string().min(1).max(100),
  questionCount: z.number().min(5).max(50),
  questionsPerRound: z.number().min(3).max(10)
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
      return new Response(JSON.stringify({ error: 'Invalid input data' }), { status: 400 });
    }

    const { name, questionCount, questionsPerRound } = parsed.data;
    const client = await clientPromise;
    const db = client.db();

    // Generate a unique quiz ID
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate total rounds
    const totalRounds = Math.ceil(questionCount / questionsPerRound);

    // Create sample questions (you can modify this to use your own questions)
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

    // Create quiz document
    const quizDoc = {
      quizId,
      name,
      questionCount,
      questionsPerRound,
      totalRounds,
      questions,
      active: false,
      currentRound: 1,
      paused: false,
      createdAt: new Date(),
      createdBy: 'admin'
    };

    // Insert quiz into database
    await db.collection('quizzes').insertOne(quizDoc);

    return new Response(JSON.stringify({
      success: true,
      quizId,
      message: `Quiz "${name}" created successfully with ${questionCount} questions in ${totalRounds} rounds`
    }), { status: 201 });

  } catch (error) {
    console.error('Error creating quiz:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 