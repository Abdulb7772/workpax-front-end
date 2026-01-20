"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { updateUsername, updatePassword, updateEmail, getCurrentUser } from "@/lib/api";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { update } = useSession();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  // Email update handler
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEmail(newEmail);
      // Fetch fresh user data and update session
      const updatedUser = await getCurrentUser();
      await update({ user: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role } });
      toast.success("Email updated! Please check your new email for a verification link.");
      setShowEmailModal(false);
      setNewEmail("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update email");
    }
  };


  // Username update handler
  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUsername(username);
      // Fetch fresh user data and update session
      const updatedUser = await getCurrentUser();
      await update({ user: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role } });
      toast.success("Username updated successfully!");
      setShowUsernameModal(false);
      setUsername("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update username");
    }
  };

  // Password update handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-600">Settings</h1>
      <div className="bg-white/80 rounded-xl shadow-lg p-8 border-l-8 border-purple-400 flex flex-col items-center gap-8">
        <button
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-purple-700 transition"
          onClick={() => setShowUsernameModal(true)}
        >
          Change Username
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition"
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>
        <button
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-green-700 transition"
          onClick={() => setShowEmailModal(true)}
        >
          Change Email
        </button>
            {/* Email Modal */}
            {showEmailModal && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.1)' }}
                onClick={() => setShowEmailModal(false)}
              >
                <div
                  className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border-l-8 border-green-400 relative"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                    onClick={() => setShowEmailModal(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <h2 className="text-xl font-bold mb-2 text-green-700">Change Email</h2>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                       required
                    />
                    <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Update Email</button>
                  </form>
                </div>
              </div>
            )}
      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.1)' }}
          onClick={() => setShowUsernameModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border-l-8 border-purple-400 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowUsernameModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={handleUsernameChange} className="space-y-4">
              <h2 className="text-xl font-bold mb-2 text-purple-700">Change Username</h2>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter new username"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
              <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Update Username</button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.1)' }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border-l-8 border-blue-400 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <h2 className="text-xl font-bold mb-2 text-blue-700">Change Password</h2>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Update Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
