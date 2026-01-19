"use client";

import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/useAuth";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { user: authUser } = useAuth();
  const user = session?.user || authUser;

  return (
    <div className="max-w-xl mx-auto p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Profile Information</h1>
      <div className="bg-white/80 rounded-xl shadow-lg p-8 border-l-8 border-blue-400">
        {user ? (
          <>
            <div className="mb-6">
              <span className="block text-gray-500 font-semibold mb-1">Name</span>
              <span className="text-lg font-bold text-gray-800">{user.name}</span>
            </div>
            <div className="mb-6">
              <span className="block text-gray-500 font-semibold mb-1">Email</span>
              <span className="text-lg font-bold text-gray-800">{user.email}</span>
            </div>
            {user.role && (
              <div className="mb-6">
                <span className="block text-gray-500 font-semibold mb-1">Role</span>
                <span className="text-lg font-bold text-gray-800 capitalize">{user.role}</span>
              </div>
            )}
            {user.isVerified !== undefined && (
              <div className="mb-6">
                <span className="block text-gray-500 font-semibold mb-1">Verified</span>
                <span className={`text-lg font-bold ${user.isVerified ? 'text-green-600' : 'text-red-600'}`}>{user.isVerified ? 'Yes' : 'No'}</span>
              </div>
            )}
            {user.createdAt && (
              <div className="mb-6">
                <span className="block text-gray-500 font-semibold mb-1">Joined</span>
                <span className="text-lg font-bold text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {user.updatedAt && (
              <div className="mb-6">
                <span className="block text-gray-500 font-semibold mb-1">Last Updated</span>
                <span className="text-lg font-bold text-gray-800">{new Date(user.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
            {user.image && (
              <div className="mb-6 flex flex-col items-start">
                <span className="block text-gray-500 font-semibold mb-1">Profile Image</span>
                <img src={user.image} alt="Profile" className="w-24 h-24 rounded-full border-2 border-blue-300 object-cover" />
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500">No user information found.</div>
        )}
      </div>
    </div>
  );
}
