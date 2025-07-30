import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const generateIdSchema = z.object({
  displayName: z.string().min(3).max(50)
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { displayName } = generateIdSchema.parse(body);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Generate a unique 4-digit ID
    let uniqueId;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    
    do {
      // Generate random 4-digit number
      uniqueId = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
      
      // Check if this ID already exists
      const existingUser = await db.collection('users').findOne({ uniqueId });
      
      if (!existingUser) {
        break; // Found a unique ID
      }
      
      // If we've tried too many times, return error
      if (attempts >= maxAttempts) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Unable to generate unique ID. Please try again.'
        }), { status: 500 });
      }
    } while (true);
    
    return new Response(JSON.stringify({
      success: true,
      uniqueId,
      displayName: `${displayName}#${uniqueId}`,
      message: 'Unique ID generated successfully'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Generate ID error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid display name',
        details: error.errors
      }), { status: 400 });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Server error'
    }), { status: 500 });
  }
} 