import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function GET(req, { params }) {
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
    
    // Get quiz info to check if it's active and get creation time
    const quizDoc = await db.collection('quizzes').findOne({ quizId });
    if (!quizDoc) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404 });
    }
    
    const isQuizActive = quizDoc.active || false;
    const quizCreatedAt = new Date(quizDoc.createdAt).getTime();
    
    // Get all users who joined AFTER this quiz was created
    const allUsers = await db.collection('users').find({}).toArray();
    const usersForThisQuiz = allUsers.filter(user => {
      const userJoinedAt = new Date(user.createdAt).getTime();
      return userJoinedAt >= quizCreatedAt;
    });
    
    // Get users who have answered questions in this quiz (active participants)
    const activeUsers = await db.collection('answers').distinct('userId', { quizId });
    
    // Get users who are in waiting room (joined after quiz creation but haven't answered yet)
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
    
    return new Response(JSON.stringify(userCountData), { status: 200 });
    
  } catch (error) {
    console.error('User count error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 