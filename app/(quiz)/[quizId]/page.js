export default function QuizPage({ params }) {
  const { quizId } = params;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz: {quizId}</h1>
      <p>Quiz questions will appear here.</p>
    </div>
  );
} 