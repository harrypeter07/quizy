/**
 * @typedef {Object} AnswerSubmission
 * @property {string} userId
 * @property {string} quizId
 * @property {string} questionId
 * @property {string} selectedOption
 * @property {number} serverTimestamp
 * @property {number} questionStartTimestamp
 * @property {number} responseTimeMs
 */

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} userId
 * @property {string} displayName
 * @property {string} uniqueId
 * @property {number} score
 * @property {number} rank
 * @property {number} accuracy
 * @property {number} averageResponseTime
 * @property {number} correctAnswers
 * @property {number} totalQuestions
 */

/**
 * @typedef {Object} EvaluationStats
 * @property {number} totalParticipants
 * @property {number} averageScore
 * @property {number} highestScore
 * @property {number} lowestScore
 * @property {number} averageAccuracy
 * @property {number} averageResponseTime
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} type
 * @property {number} count
 * @property {Array} details
 */

/**
 * @typedef {Object} ValidationReport
 * @property {string} quizId
 * @property {number} totalAnswers
 * @property {number} totalUsers
 * @property {number} totalQuestions
 * @property {Array<ValidationIssue>} issues
 * @property {Array} repairs
 * @property {number} timestamp
 */

/**
 * @typedef {Object} QuizResult
 * @property {string} quizId
 * @property {Array<LeaderboardEntry>} entries
 * @property {EvaluationStats} stats
 * @property {number} evaluatedAt
 * @property {number} totalParticipants
 * @property {Object} evaluationDetails
 */

/**
 * @typedef {Object} UserAnswer
 * @property {string} questionId
 * @property {string} selectedOption
 * @property {number} responseTimeMs
 */

/**
 * @typedef {Object} UserScore
 * @property {number} totalScore
 * @property {number} averageResponseTime
 * @property {number} accuracy
 * @property {number} correctAnswers
 * @property {number} totalQuestions
 * @property {Array} detailedScores
 */ 