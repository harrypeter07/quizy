// Shared pause points storage for consistency across API routes
let pausePointsStorage = new Map();
let userProgressStorage = new Map(); // Track user progress to prevent bypassing pause points

// Ensure we have a single instance
if (typeof global !== 'undefined' && !global.__pauseManagerInstance) {
  global.__pauseManagerInstance = new Map();
  pausePointsStorage = global.__pauseManagerInstance;
} else if (typeof global !== 'undefined' && global.__pauseManagerInstance) {
  pausePointsStorage = global.__pauseManagerInstance;
}

// Ensure we have a single instance for user progress
if (typeof global !== 'undefined' && !global.__userProgressInstance) {
  global.__userProgressInstance = new Map();
  userProgressStorage = global.__userProgressInstance;
} else if (typeof global !== 'undefined' && global.__userProgressInstance) {
  userProgressStorage = global.__userProgressInstance;
}

export const PauseManager = {
  // Get pause points for a quiz
  getPausePoints: (quizId) => {
    return pausePointsStorage.get(quizId) || [];
  },

  // Set pause points for a quiz
  setPausePoints: (quizId, pausePoints) => {
    // Validate pause points
    const validPausePoints = pausePoints
      .filter(point => Number.isInteger(point) && point > 0)
      .sort((a, b) => a - b); // Sort in ascending order
    
    pausePointsStorage.set(quizId, validPausePoints);
    
    // Clear user progress when pause points are set
    userProgressStorage.delete(quizId);
    
    return validPausePoints;
  },

  // Clear pause points for a quiz
  clearPausePoints: (quizId) => {
    pausePointsStorage.delete(quizId);
    userProgressStorage.delete(quizId);
  },

  // Check if a specific question is a pause point
  isPausePoint: (quizId, questionNumber) => {
    const pausePoints = pausePointsStorage.get(quizId) || [];
    return pausePoints.includes(questionNumber);
  },

  // Get next pause point after current question
  getNextPausePoint: (quizId, currentQuestion) => {
    const pausePoints = pausePointsStorage.get(quizId) || [];
    return pausePoints.find(point => point > currentQuestion);
  },

  // Check if quiz is currently paused
  isQuizPaused: (quizId) => {
    const pausePoints = pausePointsStorage.get(quizId) || [];
    return pausePoints.length > 0;
  },

  // Get all pause points for a quiz
  getAllPausePoints: (quizId) => {
    return pausePointsStorage.get(quizId) || [];
  },

  // Track user progress to prevent bypassing pause points
  trackUserProgress: (quizId, userId, questionNumber) => {
    const key = `${quizId}_${userId}`;
    const currentProgress = userProgressStorage.get(key) || 0;
    
    // Only update if the new question number is greater than current progress
    if (questionNumber > currentProgress) {
      userProgressStorage.set(key, questionNumber);
    }
    
    return userProgressStorage.get(key);
  },

  // Get user's current progress
  getUserProgress: (quizId, userId) => {
    const key = `${quizId}_${userId}`;
    return userProgressStorage.get(key) || 0;
  },

  // Validate if user can answer a specific question
  canUserAnswerQuestion: (quizId, userId, questionNumber) => {
    const pausePoints = pausePointsStorage.get(quizId) || [];
    const userProgress = this.getUserProgress(quizId, userId);
    
    // If no pause points, user can answer any question
    if (pausePoints.length === 0) {
      return { allowed: true, reason: 'No pause points set' };
    }
    
    // If this question is a pause point, user cannot answer it
    if (pausePoints.includes(questionNumber)) {
      return { 
        allowed: false, 
        reason: `Question ${questionNumber} is a pause point`,
        pausePoint: questionNumber,
        userProgress
      };
    }
    
    // Check if user is trying to skip ahead beyond their allowed progress
    const nextPausePoint = pausePoints.find(point => point > userProgress);
    if (nextPausePoint && questionNumber >= nextPausePoint) {
      return { 
        allowed: false, 
        reason: `Cannot answer question ${questionNumber}, next pause point is ${nextPausePoint}`,
        nextPausePoint,
        userProgress,
        allowedUpTo: userProgress
      };
    }
    
    // User can answer this question
    return { allowed: true, reason: 'Question within allowed range' };
  },

  // Clear user progress for a specific quiz
  clearUserProgress: (quizId) => {
    const keysToDelete = [];
    for (const key of userProgressStorage.keys()) {
      if (key.startsWith(`${quizId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => userProgressStorage.delete(key));
  },

  // Get all users' progress for a quiz
  getAllUserProgress: (quizId) => {
    const progress = [];
    for (const [key, questionNumber] of userProgressStorage.entries()) {
      if (key.startsWith(`${quizId}_`)) {
        const userId = key.replace(`${quizId}_`, '');
        progress.push({ userId, questionNumber });
      }
    }
    return progress;
  }
};

export default PauseManager; 