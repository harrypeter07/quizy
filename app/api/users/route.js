import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const userSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(2).max(20),
  uniqueId: z.string().length(4),
  createdAt: z.string().optional()
});

export async function POST(req) {
  try {
    const body = await req.json();
    const userData = userSchema.parse(body);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Check if user already exists with same unique ID
    const existingUser = await db.collection('users').findOne({
      uniqueId: userData.uniqueId
    });
    
    if (existingUser && existingUser.userId !== userData.userId) {
      return new Response(JSON.stringify({ 
        error: 'A user with this unique ID already exists' 
      }), { status: 409 });
    }
    
    // Store user data
    const userToStore = {
      ...userData,
      displayName: userData.displayName.trim(),
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('users').updateOne(
      { userId: userData.userId },
      { $set: userToStore },
      { upsert: true }
    );
    
    return new Response(JSON.stringify({ 
      status: 'ok',
      message: 'User created successfully'
    }), { status: 200 });
    
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid user data',
        details: error.errors
      }), { status: 400 });
    }
    
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 