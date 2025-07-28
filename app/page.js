"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const displayName = Cookies.get('displayName');
    if (!displayName) {
      router.replace('/onboarding');
    } else {
      router.replace('/waiting-room');
    }
    // Add a small delay to show loading state
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [router]);

  if (loading) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  return null;
}
