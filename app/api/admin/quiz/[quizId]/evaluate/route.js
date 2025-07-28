import clientPromise from '@lib/db';
import { calculateScore } from '@lib/scoring';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req, { params }) {
  // Simple token check (improve later)
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const quizIdSchema = z.object({ quizId: z.string().min(1) });
  const parseResult = quizIdSchema.safeParse(params);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid quizId' }), { status: 400 });
  }
  const { quizId } = params;
  try {
    const client = await clientPromise;
    const db = client.db();
    const answers = await db.collection('answers').find({ quizId }).toArray();
    const users = await db.collection('users').find({}).toArray();
    // Assume questions are loaded from DB or static for now
    // Calculate scores
    const leaderboard = [];
    for (const user of users) {
      const userAnswers = answers.filter(a => a.userId === user.userId);
      let score = 0;
      for (const ans of userAnswers) {
        // For now, assume correct answer is always option 0
        const isCorrect = ans.selectedOption === '0';
        const responseTimeMs = ans.serverTimestamp - ans.questionStartTimestamp;
        score += calculateScore({ isCorrect, responseTimeMs });
      }
      leaderboard.push({ userId: user.userId, displayName: user.displayName, score });
    }
    // Sort and store top 20
    leaderboard.sort((a, b) => b.score - a.score);
    const top20 = leaderboard.slice(0, 20);
    await db.collection('leaderboard').updateOne(
      { quizId },
      { $set: { quizId, entries: top20, evaluatedAt: Date.now() } },
      { upsert: true }
    );
    return new Response(JSON.stringify({ status: 'ok', leaderboard: top20 }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 