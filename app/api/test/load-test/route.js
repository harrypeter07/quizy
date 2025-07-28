import { z } from 'zod';

const loadTestSchema = z.object({
  userCount: z.number().min(1).max(1000),
  quizId: z.string().default('default'),
  delay: z.number().min(0).max(5000).default(100),
  thinkingTime: z.string().default('1000-5000')
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { userCount, quizId, delay, thinkingTime } = loadTestSchema.parse(body);
    
    // This endpoint just validates the request and returns a test response
    // The actual load testing should be done from the client side
    
    return new Response(JSON.stringify({
      status: 'ok',
      message: `Load test request validated for ${userCount} users`,
      config: {
        userCount,
        quizId,
        delay,
        thinkingTime
      },
      timestamp: Date.now()
    }), { status: 200 });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid load test configuration',
      details: error.message
    }), { status: 400 });
  }
}

export async function GET(req) {
  // Return load test status and statistics
  return new Response(JSON.stringify({
    status: 'ready',
    message: 'Load test endpoint is ready',
    maxUsers: 1000,
    supportedQuizzes: ['default', 'science', 'history'],
    timestamp: Date.now()
  }), { status: 200 });
} 