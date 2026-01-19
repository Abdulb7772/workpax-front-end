'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import { showConfirmToast } from '@/lib/confirmToast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface OrganizationMember {
  user: User;
  role: string;
  addedAt: string;
}

interface Organization {
  _id: string;
  name: string;
  description?: string;
  members: OrganizationMember[];
  createdBy: User;
}

// Validation schema
const addUserSchema = Yup.object().shape({
  userId: Yup.string().required('Please select a user'),
  role: Yup.string().required('Role is required').oneOf(['member', 'manager']),
});

export default function ManageOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const auth = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Allow both admin and manager to view/manage
  if (!auth.isAdmin && !auth.isManager) {
    router.push('/protected/dashboard');
    return null;
  }

  useEffect(() => {
    fetchOrganizationAndUsers();
  }, [params.id]);

  const fetchOrganizationAndUsers = async () => {
    try {
      setLoading(true);
      const [orgRes, usersRes] = await Promise.all([
        axiosInstance.get(`/api/organizations/${params.id}`),
        axiosInstance.get('/api/organizations/users'),
      ]);

      setOrganization(orgRes.data.data);
      setAllUsers(usersRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values: { userId: string; role: string }, { resetForm }: any) => {
    try {
      setError('');
      setSuccess('');

      const response = await axiosInstance.post('/api/organizations/add-user', {
        organizationId: params.id,
        userId: values.userId,
        role: values.role,
      });

      if (response.data.success) {
        toast.success('User added successfully!');
        resetForm();
        fetchOrganizationAndUsers();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to add user';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    showConfirmToast({
      title: 'Remove User?',
      message: 'Are you sure you want to remove this user from the organization?',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          setError('');
          setSuccess('');

          const response = await axiosInstance.post(
            '/api/organizations/remove-user',
            {
              organizationId: params.id,
              userId: userId,
            }
          );

          if (response.data.success) {
            toast.success('User removed successfully!');
            fetchOrganizationAndUsers();
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to remove user';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      },
    });
  };

  const handleDeleteOrganization = async () => {
    showConfirmToast({
      title: 'Delete Organization?',
      message: `Are you sure you want to delete "${organization?.name}"? This action cannot be undone and will remove all members and associated data.`,
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          setError('');
          setSuccess('');

          const response = await axiosInstance.delete(`/api/organizations/${params.id}`);

          if (response.data.success) {
            toast.success('Organization deleted successfully!');
            setTimeout(() => {
              window.location.href = '/protected/dashboard';
            }, 1000);
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to delete organization';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      },
    });
  };

  // Filter out users who are already members and admin role users
  const availableUsers = allUsers.filter(
    (user) =>
      !organization?.members.some((member) => member.user._id === user._id) &&
      user.role !== 'admin'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Skeleton height={40} width={300} className="mb-4" />
            <Skeleton height={20} width={400} className="mb-8" />
            
            <div className="space-y-6">
              {/* Organization Info Skeleton */}
              <div>
                <Skeleton height={24} width={200} className="mb-3" />
                <Skeleton height={16} width={150} className="mb-2" />
                <Skeleton count={2} className="mb-2" />
              </div>

              {/* Members Section Skeleton */}
              <div>
                <Skeleton height={28} width={150} className="mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex-1">
                        <Skeleton height={20} width={200} className="mb-2" />
                        <Skeleton height={16} width={250} />
                      </div>
                      <Skeleton height={32} width={80} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add User Form Skeleton */}
              <div>
                <Skeleton height={28} width={120} className="mb-4" />
                <Skeleton height={40} className="mb-3" />
                <Skeleton height={40} className="mb-3" />
                <Skeleton height={48} width={150} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600">Organization not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {organization.name}
              </h1>
              <p className="text-gray-600">{organization.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Created by: {organization.createdBy.name}
              </p>
            </div>
            {auth.isAdmin && (
              <button
                onClick={handleDeleteOrganization}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2"
                title="Delete Organization"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Organization
              </button>
            )}
          </div>
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

        {/* Add User Section - Admin Only */}
        {auth.isAdmin && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Add User to Organization
            </h2>

            <Formik
              initialValues={{
                userId: '',
                role: 'member',
              }}
              validationSchema={addUserSchema}
              onSubmit={handleAddUser}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                        Select User
                      </label>
                      <Field
                        as="select"
                        name="userId"
                        id="userId"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Choose a user...</option>
                        {availableUsers.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="userId" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div className="md:col-span-1">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <Field
                        as="select"
                        name="role"
                        id="role"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="member">Member (User)</option>
                        <option value="manager">Manager</option>
                      </Field>
                      <ErrorMessage name="role" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Adding...' : 'Add User'}
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Organization Members ({organization.members.length})
          </h2>

          <div className="space-y-4">
            {organization.members.map((member) => (
              <div
                key={member.user._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member.user.name}
                    </p>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {member.role}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {member.user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {member.user._id !== organization.createdBy._id && (
                  <button
                    onClick={() => handleRemoveUser(member.user._id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}

                {member.user._id === organization.createdBy._id && (
                  <span className="px-4 py-2 text-sm font-medium text-gray-500">
                    Creator
                  </span>
                )}
              </div>
            ))}

            {organization.members.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No members in this organization yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
