import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const submissionSchema = z.object({
  userId: z.string().min(1),
  quizId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.string().min(1),
  questionStartTimestamp: z.number().int().positive()
});

export async function POST(req) {
  try {
    const data = await req.json();
    const parsed = submissionSchema.safeParse(data);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    const { userId, quizId, questionId, selectedOption, questionStartTimestamp } = parsed.data;
    const serverTimestamp = Date.now();
    const client = await clientPromise;
    const db = client.db();
    const answers = db.collection('answers');
    // Upsert answer, prevent duplicates
    const result = await answers.updateOne(
      { userId, questionId },
      { $setOnInsert: { userId, quizId, questionId, selectedOption, serverTimestamp, questionStartTimestamp } },
      { upsert: true }
    );
    if (result.upsertedCount === 0) {
      // Duplicate submission
      return new Response(JSON.stringify({ status: 'duplicate' }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: 'ok', serverTimestamp }), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 