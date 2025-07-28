export default function LoadingSpinner({ message = "Loading...", size = "medium", inline = false }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center p-2">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 mb-2`}></div>
        {message && <p className="text-gray-600 text-sm">{message}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mb-4`}></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
} 