'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { showConfirmToast } from '@/lib/confirmToast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import type { Task } from '@/types/task';

interface User {
  _id: string;
  name: string;
  email: string;
}

const taskSchema = Yup.object().shape({
  title: Yup.string()
    .required('Task title is required')
    .min(3, 'Title must be at least 3 characters'),
  description: Yup.string(),
  assignedTo: Yup.string().required('Please assign this task to a user'),
  priority: Yup.string().required('Priority is required').oneOf(['low', 'medium', 'high', 'urgent']),
  status: Yup.string().required('Status is required').oneOf(['todo', 'in-progress', 'review', 'completed', 'blocked']),
  startDate: Yup.date().required('Start date is required'),
  dueDate: Yup.date()
    .required('Due date is required')
    .min(Yup.ref('startDate'), 'Due date must be after start date'),
  estimatedHours: Yup.number().min(0, 'Hours must be positive').nullable(),
  actualHours: Yup.number().min(0, 'Hours must be positive').nullable(),
});

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const auth = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.isAdmin && !auth.isManager) {
      toast.error('You do not have permission to edit tasks');
      router.back();
      return;
    }
    fetchTask();
    fetchProjectMembers();
  }, [params.taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${params.taskId}`);
      setTask(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load task';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${params.id}`);
      const members = response.data.data.members.map((m: any) => m.user);
      setProjectMembers(members);
    } catch (err: any) {
      console.error('Failed to load project members:', err);
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setError('');

      const response = await axiosInstance.put(`/api/tasks/${params.taskId}`, {
        title: values.title,
        description: values.description,
        assignedTo: values.assignedTo,
        priority: values.priority,
        status: values.status,
        startDate: values.startDate,
        dueDate: values.dueDate,
        estimatedHours: values.estimatedHours || undefined,
        actualHours: values.actualHours || undefined,
      });

      if (response.data.success) {
        toast.success('Task updated successfully!');
        router.push(`/protected/projects/${params.id}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update task';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    showConfirmToast({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'red',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/tasks/${params.taskId}`);
          toast.success('Task deleted successfully!');
          router.push(`/protected/projects/${params.id}`);
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to delete task';
          toast.error(errorMsg);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton height={40} width={200} className="mb-6" />
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Skeleton height={32} width={150} className="mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Skeleton height={20} width={120} className="mb-2" />
                  <Skeleton height={40} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Task not found'}</p>
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Task
            </button>
          </div>

          <Formik
            initialValues={{
              title: task.title || '',
              description: task.description || '',
              assignedTo: task.assignedTo?._id || '',
              priority: task.priority || 'medium',
              status: task.status || 'todo',
              startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
              estimatedHours: task.estimatedHours || '',
              actualHours: task.actualHours || '',
            }}
            validationSchema={taskSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <Field
                      type="text"
                      name="title"
                      id="title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task title"
                    />
                    <ErrorMessage name="title" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      id="description"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter task description (optional)"
                    />
                    <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To *
                      </label>
                      <Field
                        as="select"
                        name="assignedTo"
                        id="assignedTo"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select user</option>
                        {projectMembers.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="assignedTo" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <Field
                        as="select"
                        name="priority"
                        id="priority"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Field>
                      <ErrorMessage name="priority" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <Field
                        as="select"
                        name="status"
                        id="status"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </Field>
                      <ErrorMessage name="status" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <Field
                        type="date"
                        name="startDate"
                        id="startDate"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <ErrorMessage name="startDate" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date *
                      </label>
                      <Field
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <ErrorMessage name="dueDate" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Hours
                      </label>
                      <Field
                        type="number"
                        name="estimatedHours"
                        id="estimatedHours"
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <ErrorMessage name="estimatedHours" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="actualHours" className="block text-sm font-medium text-gray-700 mb-2">
                        Actual Hours
                      </label>
                      <Field
                        type="number"
                        name="actualHours"
                        id="actualHours"
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <ErrorMessage name="actualHours" component="div" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
