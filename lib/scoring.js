// Calculate score based on correctness, relevance, and response time
export function calculateScore({ selectedOption, correctAnswers, responseTimeMs, maxTime = 15000 }) {
  // Cap maxTime at 60 seconds to prevent unrealistic scoring
  const cappedMaxTime = Math.min(maxTime, 60000);
  // Validate inputs
  if (!selectedOption || !correctAnswers || !Array.isArray(correctAnswers)) {
    return 0;
  }
  
  // Ensure responseTimeMs is a valid number
  const validResponseTime = typeof responseTimeMs === 'number' && !isNaN(responseTimeMs) && responseTimeMs >= 0 
    ? responseTimeMs 
    : 0;
  
  // Find the matching correct answer
  const matchingAnswer = correctAnswers.find(ca => ca.option.toString() === selectedOption);
  
  if (!matchingAnswer) {
    return 0; // No points for wrong answer
  }
  
  // Base points from answer relevance
  const basePoints = matchingAnswer.points || 0;
  
  // Time bonus calculation (faster = more bonus)
  const timeRatio = Math.max(0, 1 - (validResponseTime / cappedMaxTime));
  const timeBonus = Math.floor(basePoints * 0.3 * timeRatio); // Up to 30% bonus for speed
  
  // Calculate final score
  const finalScore = basePoints + timeBonus;
  
  return Math.max(1, finalScore); // Minimum 1 point for any correct answer
}

// Calculate comprehensive score for a user across all questions
export function calculateUserScore(userAnswers, questions) {
  let totalScore = 0;
  let totalResponseTime = 0;
  let correctAnswers = 0;
  let validAnswers = 0;
  let detailedScores = [];
  
  for (const answer of userAnswers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) {
      console.warn(`Question ${answer.questionId} not found in questions list`);
      continue;
    }
    
    // Validate response time with safeguards
    let validResponseTime = typeof answer.responseTimeMs === 'number' && !isNaN(answer.responseTimeMs) && answer.responseTimeMs >= 0 
      ? answer.responseTimeMs 
      : 0;
    
    // Cap response time at 60 seconds (60000ms) to prevent unrealistic values
    validResponseTime = Math.min(validResponseTime, 60000);
    
    const score = calculateScore({
      selectedOption: answer.selectedOption,
      correctAnswers: question.correctAnswers,
      responseTimeMs: validResponseTime
    });
    
    totalScore += score;
    totalResponseTime += validResponseTime;
    validAnswers++;
    
    if (score > 0) {
      correctAnswers++;
    }
    
    detailedScores.push({
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      score,
      responseTimeMs: validResponseTime,
      maxPossibleScore: Math.max(...question.correctAnswers.map(ca => ca.points || 0))
    });
  }
  
  const averageResponseTime = validAnswers > 0 ? totalResponseTime / validAnswers : 0;
  const accuracy = validAnswers > 0 ? (correctAnswers / validAnswers) * 100 : 0;
  
  return {
    totalScore,
    averageResponseTime,
    accuracy,
    correctAnswers,
    totalQuestions: validAnswers,
    detailedScores
  };
}

// Batch process multiple users for evaluation
export function batchEvaluateUsers(usersData, questions) {
  const results = [];
  
  for (const userData of usersData) {
    if (!userData.answers || !Array.isArray(userData.answers) || userData.answers.length === 0) {
      console.warn(`No valid answers found for user ${userData.userId}`);
      continue;
    }
    
    const userScore = calculateUserScore(userData.answers, questions);
    
    results.push({
      userId: userData.userId,
      displayName: userData.displayName || 'Unknown',
      uniqueId: userData.uniqueId || 'Unknown',
      ...userScore
    });
  }
  
  // Sort by total score (descending), then by average response time (ascending)
  results.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.averageResponseTime - b.averageResponseTime;
  });
  
  return results;
}

// Calculate statistics for the evaluation
export function calculateEvaluationStats(results) {
  if (results.length === 0) {
    return {
      totalParticipants: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      averageAccuracy: 0,
      averageResponseTime: 0
    };
  }
  
  const scores = results.map(r => r.totalScore).filter(s => typeof s === 'number' && !isNaN(s));
  const accuracies = results.map(r => r.accuracy).filter(a => typeof a === 'number' && !isNaN(a));
  const responseTimes = results.map(r => r.averageResponseTime).filter(r => typeof r === 'number' && !isNaN(r));
  
  return {
    totalParticipants: results.length,
    averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    averageAccuracy: accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0,
    averageResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0
  };
} 