import clientPromise from '@/lib/db.js';
import { getQuestions } from '@/lib/questions.js';
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
    
    // Get all data
    const [answers, users, questions] = await Promise.all([
      db.collection('answers').find({ quizId }).toArray(),
      db.collection('users').find({}).toArray(),
      Promise.resolve(getQuestions(quizId))
    ]);
    
    const validationReport = {
      quizId,
      totalAnswers: answers.length,
      totalUsers: users.length,
      totalQuestions: questions.length,
      issues: [],
      repairs: [],
      timestamp: Date.now()
    };
    
    // Check for missing required fields
    const answersWithMissingFields = answers.filter(a => !a.userId || !a.questionId || !a.selectedOption);
    if (answersWithMissingFields.length > 0) {
      validationReport.issues.push({
        type: 'missing_required_fields',
        count: answersWithMissingFields.length,
        details: answersWithMissingFields.map(a => ({
          _id: a._id,
          missingFields: [
            !a.userId && 'userId',
            !a.questionId && 'questionId',
            !a.selectedOption && 'selectedOption'
          ].filter(Boolean)
        }))
      });
    }
    
    // Check for invalid response times
    const answersWithInvalidTime = answers.filter(a => 
      typeof a.responseTimeMs !== 'number' || isNaN(a.responseTimeMs) || a.responseTimeMs < 0
    );
    if (answersWithInvalidTime.length > 0) {
      validationReport.issues.push({
        type: 'invalid_response_time',
        count: answersWithInvalidTime.length,
        details: answersWithInvalidTime.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId,
          responseTimeMs: a.responseTimeMs
        }))
      });
    }
    
    // Check for answers with non-existent questions
    const questionIds = questions.map(q => q.id);
    const answersWithInvalidQuestions = answers.filter(a => !questionIds.includes(a.questionId));
    if (answersWithInvalidQuestions.length > 0) {
      validationReport.issues.push({
        type: 'invalid_question_id',
        count: answersWithInvalidQuestions.length,
        details: answersWithInvalidQuestions.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    
    // Check for answers with non-existent users
    const userIds = users.map(u => u.userId);
    const answersWithInvalidUsers = answers.filter(a => !userIds.includes(a.userId));
    if (answersWithInvalidUsers.length > 0) {
      validationReport.issues.push({
        type: 'invalid_user_id',
        count: answersWithInvalidUsers.length,
        details: answersWithInvalidUsers.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    
    // Check for duplicate answers (same user, same question)
    const duplicateAnswers = [];
    const seen = new Set();
    answers.forEach(a => {
      const key = `${a.userId}-${a.questionId}`;
      if (seen.has(key)) {
        duplicateAnswers.push(a);
      } else {
        seen.add(key);
      }
    });
    
    if (duplicateAnswers.length > 0) {
      validationReport.issues.push({
        type: 'duplicate_answers',
        count: duplicateAnswers.length,
        details: duplicateAnswers.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    
    // Check for missing round information
    const answersWithoutRound = answers.filter(a => typeof a.round !== 'number');
    if (answersWithoutRound.length > 0) {
      validationReport.issues.push({
        type: 'missing_round_info',
        count: answersWithoutRound.length,
        details: answersWithoutRound.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    
    // Store validation report
    await db.collection('validationReports').updateOne(
      { quizId },
      { $set: validationReport },
      { upsert: true }
    );
    
    console.log(`Data validation complete for quiz ${quizId}: ${validationReport.issues.length} issues found`);
    
    return new Response(JSON.stringify({
      status: 'ok',
      validationReport,
      message: `Validation complete. Found ${validationReport.issues.length} issues.`
    }), { status: 200 });
    
  } catch (error) {
    console.error('Data validation error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 