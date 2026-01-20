'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';

const signupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .matches(
      /^[A-Za-z]+(?: [A-Za-z]+)+$/,
      "Enter first and last name using letters only"
    )
    .required('Name is required'),
   email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required')
      .matches(
        /[A-Z]/,
        "Password must contain at least one uppercase letter"
      )
      .matches(
        /[a-z]/,
        "Password must contain at least one lowercase letter"
      )
      .matches(
        /[0-9]/,
        "Password must contain at least one number"
      )
      .matches(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function SignupPage() {
  const router = useRouter();
 

  const handleSubmit = async (
    values: { name: string; email: string; password: string; confirmPassword: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      // Register the user
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          role: 'member', // Default role is member
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Signup failed');
        setSubmitting(false);
        return;
      }

      toast.success('Account created! Please check your email for verification.');
      
      // Redirect to verification page with email
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      toast.error('An error occurred during signup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative font-sans overflow-hidden">
      
      {/* 1. TOP SECTION: Gaming Image */}
      <div className="relative h-[55vh] w-full">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(/gamer.jpg)',
            filter: 'brightness(01.0)' 
          }}
        />

        {/* The Curve Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg className="relative block w-full h-15" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
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
      <div className="flex-1 bg-linear-to-r from-red-500 via-purple-600 to-violet-500 relative">
      </div>

      {/* 3. CENTERED CARD (Floating over both) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-20 mt-10">
        
        {/* The Blue/Cyan Glow Effect Behind the Card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-blue-400/30 blur-[60px] rounded-full -z-10"></div>

        {/* The Glass Card */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          
          {/* Inner Card Logo */}
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-center text-3xl font-bold text-white mt-1 drop-shadow-md">
              Create Account
            </h1>
          </div>

          <Formik
            initialValues={{ name: '', email:'', password: '', confirmPassword: '' }}
            validationSchema={signupSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-200 mb-1 ml-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className="appearance-none block w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="John Doe"
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      const char = e.key;
                      if (!/[a-zA-Z ]/.test(char)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-500 pl-1" />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-200 mb-1 ml-1 uppercase tracking-wider">
                    Email address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="appearance-none block w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="example@xyz.com"
                  />
                  <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-500 pl-1" />
                </div>

                  

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-200 mb-1 ml-1 uppercase tracking-wider">
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className="appearance-none block w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-500 pl-1" />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-200 mb-1 ml-1 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="appearance-none block w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-sm text-red-500 pl-1" />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center mt-2">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-500 rounded bg-gray-700/50"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-200">
                    I agree to the{' '}
                    <a href="#" className="text-blue-400 font-bold text-sm hover:text-white transition-colors">
                      Terms and Conditions
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating account...' : 'Sign up'}
                  </button>
                </div>
                
                <div>
                  <p className="mt-2 text-center text-sm text-gray-800">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-blue-900 hover:text-blue-500">
                      Sign in
                    </Link>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
