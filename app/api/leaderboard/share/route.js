import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const shareLeaderboardSchema = z.object({
  quizId: z.string().min(1),
  leaderboardData: z.object({
    entries: z.array(z.object({
      userId: z.string(),
      displayName: z.string(),
      uniqueId: z.string(),
      score: z.number(),
      rank: z.number(),
      correctAnswers: z.number(),
      totalQuestions: z.number()
    })),
    stats: z.object({
      averageScore: z.number().optional(),
      highestScore: z.number().optional(),
      totalParticipants: z.number()
    }).optional(),
    actualCount: z.number(),
    evaluatedAt: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'number' ? new Date(val).toISOString() : val
    )
  })
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { quizId, leaderboardData } = shareLeaderboardSchema.parse(body);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Store the shared leaderboard data
    await db.collection('sharedLeaderboards').updateOne(
      { quizId },
      { 
        $set: { 
          quizId,
          leaderboardData,
          sharedAt: new Date().toISOString(),
          isShared: true
        }
      },
      { upsert: true }
    );
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Leaderboard shared successfully' 
    }), { status: 200 });
    
  } catch (error) {
    // console.error('Share leaderboard error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to share leaderboard' 
    }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    
    if (!quizId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Quiz ID is required' 
      }), { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get the shared leaderboard data
    const sharedData = await db.collection('sharedLeaderboards').findOne({ 
      quizId,
      isShared: true 
    });
    
    if (!sharedData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No shared leaderboard found for this quiz' 
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      leaderboardData: sharedData.leaderboardData,
      sharedAt: sharedData.sharedAt
    }), { status: 200 });
    
  } catch (error) {
    // console.error('Get shared leaderboard error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to get shared leaderboard' 
    }), { status: 500 });
  }
} 