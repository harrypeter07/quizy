export default function LoadingSpinner({ message = "Loading...", size = "medium", inline = false }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center p-2">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[#14134c]/20 border-t-[#14134c] mb-2`}></div>
        {message && <p className="text-[#14134c]/80 text-sm font-medium">{message}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-[#14134c] to-[#f8e0a0] opacity-10"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex flex-col items-center justify-center">
            <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-[#14134c]/20 border-t-[#14134c] mb-4`}></div>
            <p className="text-[#14134c] font-semibold text-lg">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 