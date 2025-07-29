import clientPromise from '@/lib/db.js';
import { getQuestions } from '@/lib/questions.js';
import { z } from 'zod';

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req, { params }) {
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
    
    // Get all data
    const [answers, users, questions] = await Promise.all([
      db.collection('answers').find({ quizId }).toArray(),
      db.collection('users').find({}).toArray(),
      Promise.resolve(getQuestions(quizId))
    ]);
    
    console.log('🔍 VALIDATION DEBUG INFO:');
    console.log(`- Quiz ID: ${quizId}`);
    console.log(`- Total Answers: ${answers.length}`);
    console.log(`- Total Users in DB: ${users.length}`);
    console.log(`- Total Questions: ${questions.length}`);
    
    if (answers.length > 0) {
      console.log(`- Sample Answer:`, answers[0]);
      console.log(`- Unique User IDs in Answers:`, [...new Set(answers.map(a => a.userId))].slice(0, 10));
    }
    
    if (users.length > 0) {
      console.log(`- Sample User:`, users[0]);
      console.log(`- User IDs in DB:`, users.map(u => u.userId).slice(0, 10));
    }
    
    const validationReport = {
      quizId,
      totalAnswers: answers.length,
      totalUsers: users.length,
      totalQuestions: questions.length,
      issues: [],
      repairs: [],
      timestamp: Date.now()
    };
    
    // Check for missing required fields
    const answersWithMissingFields = answers.filter(a => !a.userId || !a.questionId || !a.selectedOption);
    if (answersWithMissingFields.length > 0) {
      validationReport.issues.push({
        type: 'missing_required_fields',
        count: answersWithMissingFields.length,
        details: answersWithMissingFields.map(a => ({
          _id: a._id,
          missingFields: [
            !a.userId && 'userId',
            !a.questionId && 'questionId',
            !a.selectedOption && 'selectedOption'
          ].filter(Boolean)
        }))
      });
    }
    
    // Check for invalid response times
    const answersWithInvalidTime = answers.filter(a => 
      typeof a.responseTimeMs !== 'number' || isNaN(a.responseTimeMs) || a.responseTimeMs < 0
    );
    if (answersWithInvalidTime.length > 0) {
      validationReport.issues.push({
        type: 'invalid_response_time',
        count: answersWithInvalidTime.length,
        details: answersWithInvalidTime.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId,
          responseTimeMs: a.responseTimeMs
        }))
      });
    }
    
    // Check for answers with non-existent questions
    const questionIds = questions.map(q => q.id);
    const answersWithInvalidQuestions = answers.filter(a => !questionIds.includes(a.questionId));
    if (answersWithInvalidQuestions.length > 0) {
      validationReport.issues.push({
        type: 'invalid_question_id',
        count: answersWithInvalidQuestions.length,
        details: answersWithInvalidQuestions.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    
    // Check for answers with non-existent users
    const userIds = users.map(u => u.userId);
    const answersWithInvalidUsers = answers.filter(a => !userIds.includes(a.userId));
    if (answersWithInvalidUsers.length > 0) {
      validationReport.issues.push({
        type: 'invalid_user_id',
        count: answersWithInvalidUsers.length,
        details: answersWithInvalidUsers.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    
    // Check for duplicate answers (same user, same question)
    const duplicateAnswers = [];
    const seen = new Set();
    answers.forEach(a => {
      const key = `${a.userId}-${a.questionId}`;
      if (seen.has(key)) {
        duplicateAnswers.push(a);
      } else {
        seen.add(key);
      }
    });
    
    if (duplicateAnswers.length > 0) {
      validationReport.issues.push({
        type: 'duplicate_answers',
        count: duplicateAnswers.length,
        details: duplicateAnswers.map(a => ({
          _id: a._id,
          userId: a.userId,
          questionId: a.questionId
        }))
      });
    }
    

    
    // Calculate user scores and participant information
    const userScores = [];
    const userAnswerMap = new Map();
    
    // Group answers by user
    answers.forEach(answer => {
      if (!userAnswerMap.has(answer.userId)) {
        userAnswerMap.set(answer.userId, []);
      }
      userAnswerMap.get(answer.userId).push(answer);
    });
    
    console.log(`🔍 USER SCORE CALCULATION DEBUG:`);
    console.log(`- Total unique users with answers: ${userAnswerMap.size}`);
    console.log(`- Users in DB: ${users.length}`);
    
    // Calculate scores for each user using the same logic as the evaluation
    for (const [userId, userAnswers] of userAnswerMap) {
      const user = users.find(u => u.userId === userId);
      
      // If user doesn't exist in DB, create a basic user object
      const userInfo = user || {
        userId: userId,
        displayName: `User ${userId}`,
        uniqueId: userId
      };
      
      console.log(`- Processing user: ${userId}, Answers: ${userAnswers.length}`);
      
      if (!user) {
        console.log(`  ⚠️ User ${userId} not found in DB, using default info`);
      }
      
      let totalScore = 0;
      let correctAnswers = 0;
      let totalResponseTime = 0;
      let validAnswers = 0;
      
      for (const answer of userAnswers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;
        
        // Validate response time
        const validResponseTime = typeof answer.responseTimeMs === 'number' && !isNaN(answer.responseTimeMs) && answer.responseTimeMs >= 0 
          ? answer.responseTimeMs 
          : 0;
        
        // Find matching correct answer
        const matchingAnswer = question.correctAnswers.find(ca => ca.option.toString() === answer.selectedOption);
        
        if (matchingAnswer) {
          // Base points from answer relevance
          const basePoints = matchingAnswer.points || 0;
          
          // Time bonus calculation (faster = more bonus) - same as evaluation logic
          const maxTime = 15000;
          const timeRatio = Math.max(0, 1 - (validResponseTime / maxTime));
          const timeBonus = Math.floor(basePoints * 0.3 * timeRatio); // Up to 30% bonus for speed
          
          // Calculate final score
          const finalScore = basePoints + timeBonus;
          const score = Math.max(1, finalScore); // Minimum 1 point for any correct answer
          
          totalScore += score;
          correctAnswers++;
        }
        
        totalResponseTime += validResponseTime;
        validAnswers++;
      }
      
      const averageResponseTime = validAnswers > 0 ? totalResponseTime / validAnswers : 0;
      const accuracy = validAnswers > 0 ? (correctAnswers / validAnswers) * 100 : 0;
      
      userScores.push({
        userId: userInfo.userId,
        displayName: userInfo.displayName || 'Unknown',
        uniqueId: userInfo.uniqueId || 'Unknown',
        score: totalScore,
        accuracy: accuracy,
        averageResponseTime: averageResponseTime,
        correctAnswers: correctAnswers,
        totalQuestions: validAnswers,
        totalAnswers: userAnswers.length
      });
      
      console.log(`  ✅ User ${userId} processed - Score: ${totalScore}, Accuracy: ${accuracy.toFixed(1)}%`);
    }
    
    // Sort users by score (descending)
    userScores.sort((a, b) => b.score - a.score);
    
    // Add ranks
    userScores.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    console.log(`🎯 FINAL RESULTS:`);
    console.log(`- Total users processed: ${userScores.length}`);
    console.log(`- Top 5 scores:`, userScores.slice(0, 5).map(u => `${u.userId}: ${u.score}`));
    console.log(`- Average score: ${userScores.length > 0 ? Math.round(userScores.reduce((sum, u) => sum + u.score, 0) / userScores.length) : 0}`);
    
    // Store validation report with user scores
    await db.collection('validationReports').insertOne({
      quizId,
      timestamp: new Date(),
      ...validationReport,
      participants: {
        totalUsers: userScores.length,
        userScores: userScores,
        averageScore: userScores.length > 0 ? Math.round(userScores.reduce((sum, u) => sum + u.score, 0) / userScores.length) : 0,
        highestScore: userScores.length > 0 ? Math.max(...userScores.map(u => u.score)) : 0,
        lowestScore: userScores.length > 0 ? Math.min(...userScores.map(u => u.score)) : 0
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Data validation completed',
      validationReport: {
        ...validationReport,
        participants: {
          totalUsers: userScores.length,
          userScores: userScores,
          averageScore: userScores.length > 0 ? Math.round(userScores.reduce((sum, u) => sum + u.score, 0) / userScores.length) : 0,
          highestScore: userScores.length > 0 ? Math.max(...userScores.map(u => u.score)) : 0,
          lowestScore: userScores.length > 0 ? Math.min(...userScores.map(u => u.score)) : 0
        }
      }
    }), { status: 200 });
    
  } catch (error) {
    console.error('Data validation error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
} 