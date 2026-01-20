'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import { useOrganizations } from '@/hooks/useOrganization';
import { useTeamContext } from '@/contexts/TeamContext';

const projectSchema = Yup.object().shape({
  name: Yup.string()
    .required('Project name is required')
    .min(3, 'Name must be at least 3 characters'),
  description: Yup.string(),
  organizationId: Yup.string().required('Organization is required'),
  status: Yup.string().required('Status is required'),
  startDate: Yup.date(),
  endDate: Yup.date(),
});

interface Project {
  _id: string;
  name: string;
  description?: string;
  organization: {
    _id: string;
    name: string;
  };
  team?: {
    _id: string;
    name: string;
  };
  status: string;
  startDate?: string;
  endDate?: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const auth = useAuth();
  const { selectedTeam } = useTeamContext();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  // Check if user can edit projects
  if (!auth.isAdmin && !auth.isManager) {
    router.push('/protected/dashboard');
    return null;
  }

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  useEffect(() => {
    if (project) {
      // Admins can edit any project
      if (auth.isAdmin) {
        setCanEdit(true);
      } 
      // Managers can only edit projects assigned to their selected team
      else if (auth.isManager && selectedTeam && project.team?._id === selectedTeam._id) {
        setCanEdit(true);
      } else {
        setCanEdit(false);
      }
    }
  }, [project, auth.isAdmin, auth.isManager, selectedTeam]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/projects/${params.id}`);
      setProject(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit this project');
      setSubmitting(false);
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await axiosInstance.put(`/api/projects/${params.id}`, values);

      if (response.data.success) {
        setSuccess('Project updated successfully!');
        toast.success('Project updated successfully!');
        setTimeout(() => {
          router.push(`/protected/projects/${params.id}`);
        }, 1000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update project';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Skeleton height={36} width={200} className="mb-2" />
            <Skeleton height={20} width={300} className="mb-8" />
            
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <Skeleton height={16} width={120} className="mb-2" />
                  <Skeleton height={40} />
                </div>
              ))}
              
              <div className="flex gap-4 pt-4">
                <Skeleton height={44} width={120} />
                <Skeleton height={44} width={100} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-center">
            <p className="text-xl font-semibold mb-2">Project not found</p>
            <button
              onClick={() => router.push('/protected/dashboard')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If manager doesn't have permission to edit this project
  if (auth.isManager && !canEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <p className="text-xl font-semibold mb-2 text-gray-900">Access Denied</p>
            <p className="text-gray-600 mb-4">
              You can only edit projects assigned to your selected team.
              {!selectedTeam && ' Please select a team first.'}
            </p>
            <button
              onClick={() => router.push(`/protected/projects/${params.id}`)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Project
              </h1>
              <p className="text-gray-600">
                Update project details and settings
              </p>
            </div>
            <button
              onClick={() => router.push(`/protected/projects/${params.id}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
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
              name: project.name || '',
              description: project.description || '',
              organizationId: project.organization._id || '',
              status: project.status || 'pending',
              startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
              endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            }}
            validationSchema={projectSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label
                    htmlFor="organizationId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Organization *
                  </label>
                  <Field
                    as="select"
                    name="organizationId"
                    id="organizationId"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={orgsLoading}
                  >
                    <option value="">
                      {orgsLoading ? 'Loading organizations...' : 'Select an organization'}
                    </option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="organizationId"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Project Name *
                  </label>
                  <Field
                    type="text"
                    name="name"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter project name"
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
                    placeholder="Describe your project (optional)"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status *
                  </label>
                  <Field
                    as="select"
                    name="status"
                    id="status"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </Field>
                  <ErrorMessage
                    name="status"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Start Date
                    </label>
                    <Field
                      type="date"
                      name="startDate"
                      id="startDate"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <ErrorMessage
                      name="startDate"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      End Date
                    </label>
                    <Field
                      type="date"
                      name="endDate"
                      id="endDate"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <ErrorMessage
                      name="endDate"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/protected/projects/${params.id}`)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
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
