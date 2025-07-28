export default function WaitingRoom() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
      <p className="mb-2">The quiz will start soon. Please wait...</p>
      {/* Countdown and admin control will be added here */}
    </div>
  );
} 