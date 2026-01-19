'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import { useOrganizations } from '@/hooks/useOrganization';

const projectSchema = Yup.object().shape({
  name: Yup.string()
    .required('Project name is required')
    .min(3, 'Name must be at least 3 characters'),
  description: Yup.string(),
  organizationId: Yup.string().required('Organization is required'),
  startDate: Yup.date(),
  endDate: Yup.date(),
});

export default function CreateProjectPage() {
  const router = useRouter();
  const auth = useAuth();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Array<{ userId: string; role: string }>>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // Only admins can create projects
  if (!auth.isAdmin) {
    router.push('/protected/dashboard');
    return null;
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await axiosInstance.get('/api/teams');
      setTeams(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleTeamSelect = (teamId: string) => {
    if (!teamId) {
      setSelectedTeamId('');
      setSelectedUsers([]);
      return;
    }

    setSelectedTeamId(teamId);
    
    // Find team and add all its members to the project
    const team = teams.find(t => t._id === teamId);
    if (team) {
      const teamMembers = team.members.map((member: any) => ({
        userId: member.user._id,
        role: member.role === 'admin' ? 'manager' : member.role,
      }));
      
      setSelectedUsers(teamMembers);
      toast.success(`Added ${teamMembers.length} members from ${team.name}`);
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setError('');
      setSuccess('');

      const response = await axiosInstance.post('/api/projects', {
        ...values,
        members: selectedUsers,
        teamId: selectedTeamId || null,
      });

      if (response.data.success) {
        toast.success('Project created successfully!');
        setTimeout(() => {
          window.location.href = '/protected/dashboard';
        }, 1000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create project';
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
              Create Project
            </h1>
            <p className="text-gray-600">
              Set up a new project to organize tasks and track progress
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
              organizationId: '',
              startDate: '',
              endDate: '',
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

                {/* Add Team Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Assign Team
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Add Team Dropdown */}
                    <div>
                      <label
                        htmlFor="teamSelect"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Select Team (Optional)
                      </label>
                      <select
                        id="teamSelect"
                        value={selectedTeamId}
                        onChange={(e) => handleTeamSelect(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        disabled={teamsLoading}
                      >
                        <option value="">
                          {teamsLoading ? 'Loading teams...' : 'Select a team for this project'}
                        </option>
                        {teams.map((team) => (
                          <option key={team._id} value={team._id}>
                            {team.name} ({team.members.length} members)
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        All team members will be added to this project
                      </p>
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Project Members ({selectedUsers.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                          {selectedUsers.map((user, index) => (
                            <div
                              key={user.userId}
                              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Member {index + 1}
                                </p>
                              </div>
                              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                {user.role}
                              </span>
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
                    {isSubmitting ? 'Creating...' : 'Create Project'}
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
