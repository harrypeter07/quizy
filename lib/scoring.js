// Calculate score based on correctness and response time
export function calculateScore({ isCorrect, responseTimeMs }) {
  if (!isCorrect) return 0;
  // Example: max 1000 points, linearly decrease to 200 over 15s
  const maxPoints = 1000;
  const minPoints = 200;
  const maxTime = 15000; // 15 seconds
  const score = Math.max(
    minPoints,
    maxPoints - Math.floor((maxPoints - minPoints) * (responseTimeMs / maxTime))
  );
  return score;
} 