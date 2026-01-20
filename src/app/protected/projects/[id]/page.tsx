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
import { useTeamContext } from '@/contexts/TeamContext';
import { showConfirmToast } from '@/lib/confirmToast';
import type { Task } from '@/types/task';
import TaskModal from '@/components/TaskModal';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectMember {
  user: User;
  role: string;
  addedAt: string;
}

interface Organization {
  _id: string;
  name: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  organization: Organization;
  team?: {
    _id: string;
    name: string;
  };
  status: string;
  startDate?: string;
  endDate?: string;
  members: ProjectMember[];
  createdBy: User;
  createdAt: string;
}

// Validation schemas
const addUserSchema = Yup.object().shape({
  userId: Yup.string().required('Please select a user'),
  role: Yup.string().required('Role is required').oneOf(['member', 'manager']),
});

const taskSchema = Yup.object().shape({
  title: Yup.string()
    .required('Task title is required')
    .min(3, 'Title must be at least 3 characters'),
  description: Yup.string(),
  assignedTo: Yup.string().required('Please assign this task to a user'),
  priority: Yup.string().required('Priority is required').oneOf(['low', 'medium', 'high', 'urgent']),
  startDate: Yup.date().required('Start date is required'),
  dueDate: Yup.date()
    .required('Due date is required')
    .min(Yup.ref('startDate'), 'Due date must be after start date'),
  estimatedHours: Yup.number().min(0, 'Hours must be positive').nullable(),
});

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const auth = useAuth();
  const { selectedTeam, selectedTeamRole } = useTeamContext();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchTasks();
    if (auth.isAdmin || auth.isManager) {
      fetchAllUsers();
    }
  }, [params.id]);

  useEffect(() => {
    if (project) {
      // Admins can always edit
      if (auth.isAdmin) {
        setCanEdit(true);
      } 
      // Managers can only edit if:
      // 1. Project has a team assigned
      // 2. Their selected team matches the project's team
      // 3. They are a manager in that team
      else if (auth.isManager && selectedTeam && project.team && 
               project.team._id === selectedTeam._id && 
               selectedTeamRole === 'manager') {
        setCanEdit(true);
      } else {
        setCanEdit(false);
      }
    }
  }, [project, auth.isAdmin, auth.isManager, selectedTeam, selectedTeamRole]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/api/projects/${params.id}`);
      setProject(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load project';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/organizations/users');
      setAllUsers(response.data.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get(`/api/tasks/project/${params.id}`);
      setTasks(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleDeleteProject = async () => {
    showConfirmToast({
      title: 'Delete Project?',
      message: `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          setError('');
          setSuccess('');

          const response = await axiosInstance.delete(`/api/projects/${params.id}`);

          if (response.data.success) {
            toast.success('Project deleted successfully!');
            setTimeout(() => {
              window.location.href = '/protected/dashboard';
            }, 1000);
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to delete project';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      },
    });
  };

  const handleAddUser = async (values: { userId: string; role: string }, { resetForm }: any) => {
    try {
      setError('');
      setSuccess('');

      const response = await axiosInstance.post('/api/projects/add-user', {
        projectId: params.id,
        userId: values.userId,
        role: values.role,
      });

      if (response.data.success) {
        toast.success('User added to project successfully!');
        resetForm();
        setShowAddUserForm(false);
        fetchProject();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to add user to project';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    showConfirmToast({
      title: 'Remove User?',
      message: 'Are you sure you want to remove this user from the project?',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          setError('');
          setSuccess('');

          const response = await axiosInstance.post('/api/projects/remove-user', {
            projectId: params.id,
            userId: userId,
          });

          if (response.data.success) {
            toast.success('User removed from project successfully!');
            fetchProject();
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to remove user from project';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      },
    });
  };

  const handleCreateTask = async (values: any, { resetForm }: any) => {
    try {
      setError('');
      setSuccess('');

      const response = await axiosInstance.post('/api/tasks', {
        title: values.title,
        description: values.description,
        projectId: params.id,
        assignedTo: values.assignedTo,
        priority: values.priority,
        startDate: values.startDate,
        dueDate: values.dueDate,
        estimatedHours: values.estimatedHours || undefined,
      });

      if (response.data.success) {
        toast.success('Task created successfully!');
        resetForm();
        setShowAddTaskForm(false);
        fetchTasks();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create task';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter out users who are already members
  const availableUsers = allUsers.filter(
    (user) =>
      !project?.members.some((member) => member.user._id === user._id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton height={40} width={100} className="mb-6" />
          
          {/* Project Header Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <Skeleton height={36} width={300} className="mb-4" />
            <Skeleton count={3} className="mb-2" />
            <div className="flex gap-4 mt-4">
              <Skeleton height={32} width={120} />
              <Skeleton height={32} width={150} />
              <Skeleton height={32} width={100} />
            </div>
          </div>

          {/* Members Section Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <Skeleton height={28} width={200} className="mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <Skeleton height={20} width={150} className="mb-2" />
                    <Skeleton height={16} width={200} />
                  </div>
                  <Skeleton height={32} width={80} />
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Section Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Skeleton height={28} width={150} className="mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 border rounded">
                  <Skeleton height={24} width={250} className="mb-2" />
                  <Skeleton count={2} className="mb-3" />
                  <div className="flex gap-2">
                    <Skeleton height={24} width={80} />
                    <Skeleton height={24} width={100} />
                    <Skeleton height={24} width={120} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
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

        {/* Project Header */}
        <div 
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
          onDoubleClick={() => {
            if (canEdit) {
              router.push(`/protected/projects/${params.id}/edit`);
            }
          }}
          title={canEdit ? "Double-click to edit" : ""}
          style={{ cursor: canEdit ? 'pointer' : 'default' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {canEdit && (
                  <button
                    onClick={() => router.push(`/protected/projects/${params.id}/edit`)}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                    title="Edit project"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">
                  in {project.organization.name}
                </span>
                {project.team && (
                  <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                    Team: {project.team.name}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={handleDeleteProject}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2"
                title="Delete Project"
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
                Delete Project
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <p className="font-medium text-gray-900">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="font-medium text-gray-900">{formatDate(project.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Created By</p>
              <p className="font-medium text-gray-900">{project.createdBy.name}</p>
            </div>
          </div>
        </div>

        {/* Project Members */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Project Members ({project.members.length})
            </h2>
            {(auth.isAdmin || auth.isManager) && (
              <button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Member
              </button>
            )}
          </div>

          {/* Add User Form */}
          {showAddUserForm && (auth.isAdmin || auth.isManager) && (
            <div className="mb-6 p-6 border border-purple-200 rounded-lg bg-purple-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Member
              </h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                          Select User
                        </label>
                        <Field
                          as="select"
                          name="userId"
                          id="userId"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                          Project Role
                        </label>
                        <Field
                          as="select"
                          name="role"
                          id="role"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                        </Field>
                        <ErrorMessage name="role" component="div" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Adding...' : 'Add User'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddUserForm(false)}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          <div className="space-y-4">
            {project.members.map((member) => (
              <div
                key={member.user._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member.user.name}
                    </p>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        Project: {member.role}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Org: {member.user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.user._id === project.createdBy._id && (
                    <span className="px-4 py-2 text-sm font-medium text-gray-500">
                      Creator
                    </span>
                  )}
                  {(auth.isAdmin || auth.isManager) && 
                   member.user._id !== project.createdBy._id && (
                    <button
                      onClick={() => handleRemoveUser(member.user._id)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                      title="Remove from project"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            {project.members.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No members in this project yet
              </div>
            )}
          </div>
        </div>

        {/* Project Tasks */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Tasks ({tasks.length})
            </h2>
            {(auth.isAdmin || auth.isManager) && (
              <button
                onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Task
              </button>
            )}
          </div>

          {/* Add Task Form */}
          {showAddTaskForm && (auth.isAdmin || auth.isManager) && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>
              
              <Formik
                initialValues={{
                  title: '',
                  description: '',
                  assignedTo: '',
                  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
                  startDate: '',
                  dueDate: '',
                  estimatedHours: '',
                }}
                validationSchema={taskSchema}
                onSubmit={handleCreateTask}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Task Title *
                        </label>
                        <Field
                          type="text"
                          name="title"
                          id="title"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter task title"
                        />
                        <ErrorMessage name="title" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <Field
                          as="textarea"
                          name="description"
                          id="description"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          placeholder="Enter task description (optional)"
                        />
                        <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                            Assign To *
                          </label>
                          <Field
                            as="select"
                            name="assignedTo"
                            id="assignedTo"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select user</option>
                            {project?.members
                              .filter((member) => member.user.role !== 'admin')
                              .map((member) => (
                                <option key={member.user._id} value={member.user._id}>
                                  {member.user.name} ({member.user.role})
                                </option>
                              ))}
                          </Field>
                          <ErrorMessage name="assignedTo" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                            Priority *
                          </label>
                          <Field
                            as="select"
                            name="priority"
                            id="priority"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </Field>
                          <ErrorMessage name="priority" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date *
                          </label>
                          <Field
                            type="date"
                            name="startDate"
                            id="startDate"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <ErrorMessage name="startDate" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date *
                          </label>
                          <Field
                            type="date"
                            name="dueDate"
                            id="dueDate"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <ErrorMessage name="dueDate" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50"
                        >
                          {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddTaskForm(false)}
                          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {tasks.filter((task) => {
              // Show all tasks to admin and manager
              if (auth.isAdmin || auth.isManager) {
                return true;
              }
              // Show only assigned tasks to regular members
              return task.assignedTo?._id === (auth.session?.user as any)?.id;
            }).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>No tasks {auth.isAdmin || auth.isManager ? 'in this project' : 'assigned to you'} yet</p>
              </div>
            ) : (
              tasks
                .filter((task) => {
                  // Show all tasks to admin and manager
                  if (auth.isAdmin || auth.isManager) {
                    return true;
                  }
                  // Show only assigned tasks to regular members
                  return task.assignedTo?._id === (auth.session?.user as any)?.id;
                })
                .map((task) => (
                <div
                  key={task._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedTaskId(task._id);
                    setIsModalOpen(true);
                  }}
                  title="Click to view details"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                        {task.assignedTo && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            👤 {task.assignedTo.name}
                          </span>
                        )}
                        {task.startDate && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            📅 Start: {new Date(task.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.estimatedHours && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            ⏱️ {task.estimatedHours}h
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Created by {task.createdBy.name} • {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskId(task._id);
                        setIsModalOpen(true);
                      }}
                      className="ml-4 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      title="View task details"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Task Modal */}
      {selectedTaskId && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTaskId(null);
          }}
          taskId={selectedTaskId}
          onTaskUpdated={() => {
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}
