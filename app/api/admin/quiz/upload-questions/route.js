import clientPromise from '@/lib/db.js';
import { z } from 'zod';

// Validation schema for question format
const QuestionSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1, "Option text cannot be empty")).min(2, "At least 2 options required").max(8, "Maximum 8 options allowed"),
  correctAnswers: z.array(z.object({
    option: z.number().min(0, "Option index must be 0 or greater").max(7, "Option index cannot exceed 7"),
    points: z.number().min(0, "Points must be 0 or greater")
  })).min(1, "At least one correct answer required")
});

const QuestionSetSchema = z.object({
  name: z.string().min(1, "Question set name is required").max(100, "Name too long"),
  questions: z.array(QuestionSchema).min(1, "At least one question required").max(100, "Maximum 100 questions allowed")
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
      const errorDetails = validationResult.error.errors.map(error => ({
        path: error.path,
        message: error.message,
        code: error.code
      }));
      
      return new Response(JSON.stringify({ 
        error: 'Invalid question set format',
        details: errorDetails,
        summary: `Found ${errorDetails.length} validation error(s)`
      }), { status: 400 });
    }

    const validatedQuestionSet = validationResult.data;

    // Additional validation checks
    const validationWarnings = [];
    
    // Check for duplicate question IDs
    const questionIds = validatedQuestionSet.questions.map(q => q.id);
    const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      validationWarnings.push(`Duplicate question IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check for invalid correct answer references
    validatedQuestionSet.questions.forEach((question, qIndex) => {
      question.correctAnswers.forEach((answer, aIndex) => {
        if (answer.option >= question.options.length) {
          validationWarnings.push(`Question ${qIndex + 1}: Correct answer option ${answer.option} is out of range (max: ${question.options.length - 1})`);
        }
      });
    });

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if a question set with the same name already exists
    const existingSet = await db.collection('questionSets').findOne({ 
      name: validatedQuestionSet.name,
      isCustom: true 
    });

    if (existingSet) {
      return new Response(JSON.stringify({ 
        error: 'Question set with this name already exists',
        details: `A question set named "${validatedQuestionSet.name}" already exists. Please use a different name.`
      }), { status: 409 });
    }

    // Generate a unique key for the question set
    const timestamp = Date.now();
    const questionSetKey = `custom_${timestamp}`;

    // Store the question set in the database
    const questionSetDoc = {
      key: questionSetKey,
      name: validatedQuestionSet.name,
      questions: validatedQuestionSet.questions,
      uploadedAt: new Date(),
      uploadedBy: 'admin',
      isCustom: true,
      questionCount: validatedQuestionSet.questions.length,
      validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined
    };

    await db.collection('questionSets').insertOne(questionSetDoc);

    // Prepare success message
    let successMessage = `Question set "${validatedQuestionSet.name}" uploaded successfully with ${validatedQuestionSet.questions.length} questions`;
    
    if (validationWarnings.length > 0) {
      successMessage += ` (with ${validationWarnings.length} warning(s))`;
    }

    return new Response(JSON.stringify({
      success: true,
      questionSetKey,
      message: successMessage,
      details: {
        questionCount: validatedQuestionSet.questions.length,
        warnings: validationWarnings,
        uploadedAt: new Date().toISOString()
      }
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