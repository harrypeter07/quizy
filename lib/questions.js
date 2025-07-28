// Example: Load questions from a local array (replace with DB fetch as needed)
export const questions = [
  {
    id: 'q1',
    text: 'What is the capital of France?',
    options: [
      'Paris', 'London', 'Berlin', 'Madrid', 'Rome', 'Lisbon', 'Vienna', 'Prague'
    ],
    answer: 0 // index of correct option
  },
  // Add more questions here
];

export function getQuestions(quizId) {
  // For now, return the static array
  return questions;
} 