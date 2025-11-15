"use client";

import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@mixillo.com');
  const [password, setPassword] = useState('Test@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL as string;
      const res = await axios.post(`${baseUrl}/api/auth/login`, { email, password });
      const token = res.data?.token || res.data?.accessToken || res.data?.access_token;
      if (!token) throw new Error('Invalid response');
      Cookies.set('token', token, { expires: 7 });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container min-h-screen grid place-items-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-6 rounded border">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <div className="space-y-1">
          <label className="block text-sm">Email</label>
          <input data-cy="login-email" className="w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Password</label>
          <input data-cy="login-password" className="w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p data-cy="login-error" className="text-red-600 text-sm">{error}</p>}
        <button data-cy="login-submit" disabled={loading} className="w-full bg-black text-white rounded p-2">
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </main>
  );
}
