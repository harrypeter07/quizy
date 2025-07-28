"use client";
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [formData, setFormData] = useState({
    displayName: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

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
        setStatus(`Welcome! Your unique ID is #${idData.uniqueId}`);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Quiz</h1>
          <p className="text-gray-600">Enter your details to participate</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              id="displayName"
              type="text"
              maxLength={20}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.displayName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={e => handleInputChange('displayName', e.target.value)}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.displayName.length}/20 characters
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Join Quiz'}
          </button>
          
          {status && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              {status}
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By joining, you agree to participate fairly and follow quiz rules.
          </p>
        </div>
      </div>
    </div>
  );
} 