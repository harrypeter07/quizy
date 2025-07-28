import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name is required');
      return;
    }
    // Generate userId and store in cookie
    let userId = Cookies.get('userId');
    if (!userId) {
      userId = uuidv4();
      Cookies.set('userId', userId, { expires: 30 });
    }
    Cookies.set('displayName', name, { expires: 30 });
    router.replace('/waiting-room');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Enter your display name</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-xs">
        <input
          type="text"
          className="border rounded px-3 py-2"
          placeholder="Display Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white rounded px-3 py-2 mt-2">Continue</button>
      </form>
    </div>
  );
} 