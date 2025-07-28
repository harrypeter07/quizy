"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const displayName = Cookies.get('displayName');
    if (!displayName) {
      router.replace('/onboarding');
    } else {
      router.replace('/waiting-room');
    }
  }, [router]);
  return null;
}
