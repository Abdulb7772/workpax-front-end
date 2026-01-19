'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { TeamProvider } from '@/contexts/TeamContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OrganizationProvider>
        <TeamProvider>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <ToastContainer 
          position="top-center"
          autoClose={false}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme="light"
          containerId="confirmation"
          className="Toastify__toast-container--confirmation"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'auto',
            maxWidth: '500px',
          }}
          toastStyle={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
          }}
        />
        {children}
        </TeamProvider>
      </OrganizationProvider>
    </SessionProvider>
  );
}
