'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required')
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Login successful!');
        router.push('/protected/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative font-sans overflow-hidden">

      {/* 1. TOP SECTION: Image */}
      <div className="relative h-[58vh] w-full">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/gamer.jpg)', // Ensure this path is correct
            filter: 'brightness(01.0)'
          }}
        />



        {/* The Curve Divider */}
        {/* We place the SVG at the bottom of the top section, colored with the bottom section's gradient */}
        <div className="absolute -bottom-0.5 left-0 w-full overflow-hidden leading-none z-20 h-15.5">
          <svg className="relative block w-full h-15.5" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ display: 'block' }}>
            {/* This path creates the "dip" effect */}
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="transparent" opacity="0"></path>
            {/* Simple Curved bottom */}
            <path d="M0,30 C400,120 800,120 1200,30 L1200,120 L0,120 Z" fill="url(#bottomGradient)"></path>
            <defs>
              <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="2%" stopColor="#ef4444" /> {/* Red */}
                <stop offset="50%" stopColor="#9333ea" /> {/* Purple */}
                <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet */}
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Gradient */}
      <div className="flex-1 bg-linear-to-r from-red-500 via-purple-600 to-violet-500 relative">
        {/* This div just fills the remaining space */}
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
              Welcome
            </h1>
          </div>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-200 mb-1 ml-1 uppercase tracking-wider">
                    Email address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
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
                    className="appearance-none block w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-500 pl-1" />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">


                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-medium text-blue-400 hover:text-white transition-colors">
                      Forgot your password?
                    </a>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </button>
                </div>
                <div>
                  <p className="mt-2 text-center text-sm text-gray-800">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-blue-900 hover:text-blue-500">
                      Sign up
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