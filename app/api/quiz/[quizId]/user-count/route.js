import clientPromise from '@/lib/db.js';
import { z } from 'zod';

export async function GET(req, { params }) {
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const awaitedParams = await params;
  const parseResult = quizIdSchema.safeParse(awaitedParams);
  if (!parseResult.success) {
    console.log('[user-count] Invalid quizId', awaitedParams);
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = awaitedParams;
  try {
    const client = await clientPromise;
    const db = client.db();
    // Get quiz info to check if it's active and get creation time
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    if (!quizDoc) {
      console.log(`[user-count] Quiz not found: ${quizId}`);
      // Return zero counts if quiz not found
      return new Response(JSON.stringify({
        quizId,
        quizName: null,
        quizCreatedAt: null,
        isQuizActive: false,
        totalUsers: 0,
        activeUsers: 0,
        waitingUsers: 0,
        recentUsers: 0,
        userList: [],
        lastUpdated: Date.now()
      }), { status: 200 });
    }
    const isQuizActive = quizDoc.active || false;
    const quizCreatedAt = new Date(quizDoc.createdAt).getTime();
    // Get users for this quiz by quizId
    const usersForThisQuiz = await db.collection('users').find({ quizId }).toArray();
    // Get users who have answered questions in this quiz (active participants)
    const activeUsers = await db.collection('answers').distinct('userId', { quizId });
    // Get users who are in waiting room (joined for this quiz but haven't answered yet)
    const waitingUsers = usersForThisQuiz.filter(user => !activeUsers.includes(user.userId));
    // Get recent activity (users who joined in last 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentUsers = usersForThisQuiz.filter(user => {
      const userJoinedAt = new Date(user.createdAt).getTime();
      return userJoinedAt >= fiveMinutesAgo;
    });
    const userCountData = {
      quizId,
      quizName: quizDoc.name,
      quizCreatedAt: quizCreatedAt,
      isQuizActive,
      totalUsers: usersForThisQuiz.length,
      activeUsers: activeUsers.length,
      waitingUsers: waitingUsers.length,
      recentUsers: recentUsers.length,
      userList: waitingUsers.map(user => ({
        userId: user.userId,
        displayName: user.displayName,
        uniqueId: user.uniqueId,
        joinedAt: user.createdAt || Date.now()
      })),
      lastUpdated: Date.now()
    };
    console.log('[user-count] Returning:', userCountData);
    return new Response(JSON.stringify(userCountData), { status: 200 });
  } catch (error) {
    console.error('[user-count] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 