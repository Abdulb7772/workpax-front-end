'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import { useUsers } from '@/hooks/useUsers';

const organizationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Organization name is required')
    .min(3, 'Name must be at least 3 characters'),
  description: Yup.string(),
});

export default function CreateOrganizationPage() {
  const router = useRouter();
  const auth = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Array<{ userId: string; role: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');

  // Redirect if not admin
  if (!auth.isAdmin) {
    router.push('/protected/dashboard');
    return null;
  }

  const handleAddUser = () => {
    if (!selectedUserId) return;

    // Check if user is already added
    if (selectedUsers.some(u => u.userId === selectedUserId)) {
      toast.error('User is already added');
      return;
    }

    setSelectedUsers([...selectedUsers, { userId: selectedUserId, role: selectedRole }]);
    setSelectedUserId('');
    setSelectedRole('member');
    toast.success('User added to list');
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  const getUserName = (userId: string) => {
    return users.find(u => u._id === userId)?.name || 'Unknown User';
  };

  const getUserEmail = (userId: string) => {
    return users.find(u => u._id === userId)?.email || '';
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setError('');
      setSuccess('');

      const response = await axiosInstance.post('/api/organizations', {
        ...values,
        members: selectedUsers,
      });

      if (response.data.success) {
        toast.success('Organization created successfully!');
        setTimeout(() => {
          router.push('/protected/organizations');
        }, 1500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create organization';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Organization
            </h1>
            <p className="text-gray-600">
              Set up a new organization to manage projects and team members
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <Formik
            initialValues={{
              name: '',
              description: '',
            }}
            validationSchema={organizationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Organization Name *
                  </label>
                  <Field
                    type="text"
                    name="name"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter organization name"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    id="description"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your organization (optional)"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Add Users Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Add Team Members
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label
                          htmlFor="userSelect"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Select User
                        </label>
                        <select
                          id="userSelect"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          disabled={usersLoading}
                        >
                          <option value="">
                            {usersLoading ? 'Loading users...' : 'Choose a user'}
                          </option>
                          {users
                            .filter(user => !selectedUsers.some(su => su.userId === user._id) && user.role !== 'admin')
                            .map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.name} ({user.role})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="roleSelect"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Role
                        </label>
                        <select
                          id="roleSelect"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="member">Member(user)</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddUser}
                      disabled={!selectedUserId}
                      className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      + Add User
                    </button>

                    {/* Selected Users List */}
                    {selectedUsers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Selected Members ({selectedUsers.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedUsers.map((user) => (
                            <div
                              key={user.userId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {getUserName(user.userId)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {getUserEmail(user.userId)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  {user.role}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(user.userId)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Remove user"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Organization'}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
