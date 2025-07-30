import clientPromise from '@/lib/db.js';
import { z } from 'zod';

// Validation schema for question format
const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  options: z.array(z.string()).min(2).max(8),
  correctAnswers: z.array(z.object({
    option: z.number().min(0),
    points: z.number().min(0)
  })).min(1)
});

const QuestionSetSchema = z.object({
  name: z.string().min(1),
  questions: z.array(QuestionSchema).min(1).max(100)
});

export async function POST(req) {
  try {
    // Check authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { questionSet } = body;

    if (!questionSet) {
      return new Response(JSON.stringify({ error: 'Question set is required' }), { status: 400 });
    }

    // Validate the question set format
    const validationResult = QuestionSetSchema.safeParse(questionSet);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid question set format',
        details: validationResult.error.errors
      }), { status: 400 });
    }

    const validatedQuestionSet = validationResult.data;

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Generate a unique key for the question set
    const timestamp = Date.now();
    const questionSetKey = `custom_${timestamp}`;

    // Store the question set in the database
    const questionSetDoc = {
      key: questionSetKey,
      name: validatedQuestionSet.name,
      questions: validatedQuestionSet.questions,
      uploadedAt: new Date(),
      uploadedBy: 'admin', // You can extend this to track specific admin users
      isCustom: true
    };

    await db.collection('questionSets').insertOne(questionSetDoc);

    return new Response(JSON.stringify({
      success: true,
      questionSetKey,
      message: `Question set "${validatedQuestionSet.name}" uploaded successfully with ${validatedQuestionSet.questions.length} questions`
    }), { status: 200 });

  } catch (error) {
    console.error('Error uploading question set:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error',
      details: error.message 
    }), { status: 500 });
  }
}

// GET endpoint to retrieve all custom question sets
export async function GET(req) {
  try {
    // Check authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get all custom question sets
    const customQuestionSets = await db.collection('questionSets')
      .find({ isCustom: true })
      .sort({ uploadedAt: -1 })
      .toArray();

    return new Response(JSON.stringify({
      questionSets: customQuestionSets
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching custom question sets:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error' 
    }), { status: 500 });
  }
} 