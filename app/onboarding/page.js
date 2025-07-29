"use client";
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Onboarding() {
  const [formData, setFormData] = useState({
    displayName: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [quizInfo, setQuizInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch most recently created quiz information
    const fetchRecentQuiz = async () => {
      try {
        const res = await fetch('/api/quiz/recent');
        if (res.ok) {
          const data = await res.json();
          setQuizInfo(data);
          
          // Set the quizId cookie to the recent quiz ID
          Cookies.set('quizId', data.quizId, { expires: 30 });
        }
      } catch (error) {
        console.error('Error fetching recent quiz:', error);
      }
    };
    
    fetchRecentQuiz();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (formData.displayName.trim().length > 20) {
      newErrors.displayName = 'Display name must be less than 20 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate unique 4-digit ID
      const idRes = await fetch('/api/users/generate-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName.trim()
        })
      });
      
      const idData = await idRes.json();
      
      if (!idData.success) {
        setErrors({ 
          general: 'Failed to generate unique ID. Please try again.' 
        });
        setLoading(false);
        return;
      }
      
      // Generate userId and store in cookie
      let userId = Cookies.get('userId');
      if (!userId) {
        userId = uuidv4();
        Cookies.set('userId', userId, { expires: 30 });
      }
      
      // Store user data
      const userData = {
        userId,
        displayName: formData.displayName.trim(),
        uniqueId: idData.uniqueId,
        quizId: quizInfo?.quizId,
        createdAt: new Date().toISOString()
      };
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (res.ok) {
        // Store display name and unique ID in cookies for backward compatibility
        Cookies.set('displayName', formData.displayName.trim(), { expires: 30 });
        Cookies.set('uniqueId', idData.uniqueId, { expires: 30 });
        
        // Show success message before redirecting
        setStatus(`Welcome! Your unique ID is #${idData.uniqueId} - Keep this safe!`);
        setTimeout(() => {
          router.replace('/waiting-room');
        }, 2000);
      } else {
        setErrors({ general: 'Failed to create user. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/blue-paperboard-bg.jpg"
          alt="Blue Paperboard Background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#14134c]/80 to-[#f8e0a0]/20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/90 rounded-full shadow-lg mb-4">
                <div className="text-3xl sm:text-4xl">🏆</div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
              Join Feud
            </h1>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block mb-4">
              <p className="text-white font-semibold text-lg sm:text-xl">
                Student Sports Club RBU
              </p>
            </div>
            
            {/* Quiz Information */}
            {quizInfo && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 mb-4 border border-white/20">
                <p className="text-white font-bold text-lg mb-1">{quizInfo.name}</p>
                <div className="text-white/90 text-sm space-y-1">
                  <p>{quizInfo.questionCount} Questions • {quizInfo.totalRounds} Rounds</p>
                  <p className="text-white/80 text-xs">
                    Created: {quizInfo.formattedCreatedAt}
                  </p>
                  <p className={`font-semibold ${quizInfo.active ? 'text-green-300' : 'text-yellow-300'}`}>
                    {quizInfo.active ? '🟢 Quiz is Active' : '🟡 Quiz is Inactive'}
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-white/90 text-lg sm:text-xl font-medium drop-shadow-md">
              Enter your details to participate
            </p>
          </div>
          
          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-semibold text-[#14134c] mb-3">
                  Display Name *
                </label>
                <input
                  id="displayName"
                  type="text"
                  maxLength={20}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#f8e0a0] focus:border-[#f8e0a0] transition-all duration-200 text-lg ${
                    errors.displayName ? 'border-red-300' : 'border-[#14134c]/20'
                  }`}
                  placeholder="Enter your display name"
                  value={formData.displayName}
                  onChange={e => handleInputChange('displayName', e.target.value)}
                />
                {errors.displayName && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.displayName}</p>
                )}
                <p className="mt-2 text-xs text-[#14134c]/60 font-medium">
                  {formData.displayName.length}/20 characters
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#14134c] to-[#14134c]/90 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-[#14134c]/90 hover:to-[#14134c] focus:ring-4 focus:ring-[#f8e0a0]/30 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Join Feud'
                )}
              </button>
              
              {status && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl text-center font-semibold shadow-lg">
                  <div className="text-lg mb-2">🎉 Success!</div>
                  <div className="text-sm">{status}</div>
                </div>
              )}
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-[#14134c]/70 font-medium">
                By joining, you agree to participate fairly and follow Feud rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 