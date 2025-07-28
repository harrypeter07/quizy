// Calculate score based on correctness, relevance, and response time
export function calculateScore({ selectedOption, correctAnswers, responseTimeMs, maxTime = 15000 }) {
  // Find the matching correct answer
  const matchingAnswer = correctAnswers.find(ca => ca.option.toString() === selectedOption);
  
  if (!matchingAnswer) {
    return 0; // No points for wrong answer
  }
  
  // Base points from answer relevance
  const basePoints = matchingAnswer.points;
  
  // Time bonus calculation (faster = more bonus)
  const timeRatio = Math.max(0, 1 - (responseTimeMs / maxTime));
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
  let detailedScores = [];
  
  for (const answer of userAnswers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) continue;
    
    const score = calculateScore({
      selectedOption: answer.selectedOption,
      correctAnswers: question.correctAnswers,
      responseTimeMs: answer.responseTimeMs
    });
    
    totalScore += score;
    totalResponseTime += answer.responseTimeMs;
    
    if (score > 0) {
      correctAnswers++;
    }
    
    detailedScores.push({
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      score,
      responseTimeMs: answer.responseTimeMs,
      maxPossibleScore: Math.max(...question.correctAnswers.map(ca => ca.points))
    });
  }
  
  const averageResponseTime = userAnswers.length > 0 ? totalResponseTime / userAnswers.length : 0;
  const accuracy = userAnswers.length > 0 ? (correctAnswers / userAnswers.length) * 100 : 0;
  
  return {
    totalScore,
    averageResponseTime,
    accuracy,
    correctAnswers,
    totalQuestions: userAnswers.length,
    detailedScores
  };
}

// Batch process multiple users for evaluation
export function batchEvaluateUsers(usersData, questions) {
  const results = [];
  
  for (const userData of usersData) {
    const userScore = calculateUserScore(userData.answers, questions);
    
    results.push({
      userId: userData.userId,
      displayName: userData.displayName,
      uniqueId: userData.uniqueId,
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
  
  const scores = results.map(r => r.totalScore);
  const accuracies = results.map(r => r.accuracy);
  const responseTimes = results.map(r => r.averageResponseTime);
  
  return {
    totalParticipants: results.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    averageAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
    averageResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
  };
} 