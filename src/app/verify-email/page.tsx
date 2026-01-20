'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'waiting'>('waiting');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      console.log('🔍 Verifying token:', verificationToken);
      console.log('📡 Making request to:', `http://localhost:5000/api/auth/verify-email/${verificationToken}`);
      
      const response = await fetch(`http://localhost:5000/api/auth/verify-email/${verificationToken}`);
      const data = await response.json();

      console.log('📨 Response status:', response.status);
      console.log('📦 Response data:', data);

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        toast.success('Email verified successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
        toast.error(data.message);
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
      toast.error('Verification failed');
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email address not found');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(data.message || 'Failed to resend email');
      }
    } catch (error) {
      toast.error('Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative font-sans">
      {/* 1. TOP SECTION: Gaming Image */}
      <div className="relative h-[55vh] w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(/gamer.jpg)',
            filter: 'brightness(0.8)' 
          }}
        />

        {/* The Curve Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg className="relative block w-full h-25" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="transparent" opacity="0"></path>
            <path d="M0,30 C400,120 800,120 1200,30 L1200,120 L0,120 Z" fill="url(#bottomGradient)"></path>
            <defs>
              <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Gradient */}
      <div className="flex-1 bg-linear-to-r from-red-500 via-purple-600 to-violet-500 relative"></div>

      {/* 3. CENTERED CARD */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-20 mt-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-blue-400/30 blur-[60px] rounded-full -z-10"></div>

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="flex flex-col items-center mb-6">
            {status === 'waiting' && (
              <>
                <div className="w-16 h-16 bg-linear-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-center text-3xl font-bold text-white mb-2 drop-shadow-md">
                  Check Your Email
                </h1>
                <p className="text-center text-gray-200 text-sm mb-4">
                  We've sent a verification link to <br />
                  <span className="font-semibold text-white">{email}</span>
                </p>
              </>
            )}

            {status === 'verifying' && (
              <>
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <svg className="animate-spin w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h1 className="text-center text-3xl font-bold text-white mb-2 drop-shadow-md">
                  Verifying...
                </h1>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-linear-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-center text-3xl font-bold text-white mb-2 drop-shadow-md">
                  Email Verified!
                </h1>
                <p className="text-center text-gray-200 text-sm">
                  Redirecting to login...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-linear-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-center text-3xl font-bold text-white mb-2 drop-shadow-md">
                  Verification Failed
                </h1>
                <p className="text-center text-gray-200 text-sm mb-4">
                  {message}
                </p>
              </>
            )}
          </div>

          <div className="space-y-4">
            {status === 'waiting' && (
              <>
                <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
                  <p className="text-gray-200 text-sm text-center">
                    Click the verification link in your email to activate your account.
                  </p>
                </div>

                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>

                <Link href="/login">
                  <button className="w-full flex justify-center py-3 px-4 border border-white/30 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all">
                    Go to Login
                  </button>
                </Link>
              </>
            )}

            {status === 'success' && (
              <Link href="/login">
                <button className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none shadow-lg transform transition hover:scale-[1.02]">
                  Go to Login
                </button>
              </Link>
            )}

            {status === 'error' && email && (
              <>
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                
                <Link href="/login">
                  <button className="w-full flex justify-center py-3 px-4 text-sm font-medium text-gray-200 hover:text-white transition-colors">
                    Back to Login
                  </button>
                </Link>
              </>
            )}

            {status === 'error' && !email && (
              <Link href="/Signup">
                <button className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none shadow-lg transform transition hover:scale-[1.02]">
                  Back to Sign Up
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
