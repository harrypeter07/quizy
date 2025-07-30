import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function DELETE(req, { params }) {
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
    
    // First, check if quiz exists
    const quiz = await db.collection('quizzes').findOne({ quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }

    // Delete all associated data for this quiz
    const deleteResults = await Promise.all([
      // Delete the quiz itself
      db.collection('quizzes').deleteOne({ quizId }),
      // Delete all answers for this quiz
      db.collection('answers').deleteMany({ quizId }),
      // Delete user answers for this quiz
      db.collection('userAnswers').deleteMany({ quizId }),
      // Delete leaderboard entries for this quiz
      db.collection('leaderboard').deleteMany({ quizId }),
      // Delete round progress for this quiz
      db.collection('roundProgress').deleteMany({ quizId }),
      // Remove quiz progress from users
      db.collection('users').updateMany(
        { [`quizProgress.${quizId}`]: { $exists: true } },
        { $unset: { [`quizProgress.${quizId}`]: "" } }
      )
    ]);

    const [quizDeleted, answersDeleted, userAnswersDeleted, leaderboardDeleted, roundProgressDeleted, usersUpdated] = deleteResults;

    // console.log(`[admin-delete] Quiz ${quizId} deleted successfully`);
    // console.log(`[admin-delete] - Quiz document: ${quizDeleted.deletedCount}`);
    // console.log(`[admin-delete] - Answers: ${answersDeleted.deletedCount}`);
    // console.log(`[admin-delete] - User answers: ${userAnswersDeleted.deletedCount}`);
    // console.log(`[admin-delete] - Leaderboard entries: ${leaderboardDeleted.deletedCount}`);
    // console.log(`[admin-delete] - Round progress: ${roundProgressDeleted.deletedCount}`);
    // console.log(`[admin-delete] - Users updated: ${usersUpdated.modifiedCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quiz deleted successfully',
      quizId,
      deletedAt: Date.now(),
      stats: {
        quizDeleted: quizDeleted.deletedCount,
        answersDeleted: answersDeleted.deletedCount,
        userAnswersDeleted: userAnswersDeleted.deletedCount,
        leaderboardDeleted: leaderboardDeleted.deletedCount,
        roundProgressDeleted: roundProgressDeleted.deletedCount,
        usersUpdated: usersUpdated.modifiedCount
      }
    }), { status: 200 });
  } catch (err) {
    console.error(`[admin-delete] Error deleting quiz ${quizId}:`, err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 