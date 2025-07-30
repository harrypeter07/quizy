// Utility function to convert long user ID to 4-digit format
export function getShortUserId(userId) {
  if (!userId) return '0000';
  
  // Convert the string to a number using a simple hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and get last 4 digits
  const positiveHash = Math.abs(hash);
  const fourDigitId = (positiveHash % 10000).toString().padStart(4, '0');
  
  return fourDigitId;
} 