import clientPromise from '@/lib/db.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req, { params }) {
  const token = req.headers.get('authorization');
  if (!token || token !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Delete all quizzes, users, and answers for a fresh start
    await db.collection('quizzes').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('answers').deleteMany({});
    
    // Create unique index to prevent duplicate answer submissions
    await db.collection('answers').createIndex(
      { userId: 1, quizId: 1, questionId: 1 },
      { unique: true, name: 'unique_user_quiz_question' }
    );
    
    // Create indexes for better query performance
    await db.collection('answers').createIndex(
      { quizId: 1, round: 1 },
      { name: 'quiz_round_index' }
    );
    
    await db.collection('users').createIndex(
      { uniqueId: 1 },
      { unique: true, name: 'unique_user_id' }
    );
    
    await db.collection('quizzes').createIndex(
      { quizId: 1 },
      { unique: true, name: 'unique_quiz_id' }
    );
    
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Database indexes created successfully',
      indexes: [
        'unique_user_quiz_question (userId, quizId, questionId)',
        'quiz_round_index (quizId, round)',
        'unique_user_id (uniqueId)',
        'unique_quiz_id (quizId)'
      ]
    }), { status: 200 });

  } catch (error) {
    console.error('Database setup error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create database indexes',
      details: error.message 
    }), { status: 500 });
  }
} 