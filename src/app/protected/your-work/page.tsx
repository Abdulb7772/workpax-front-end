'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import type { Task } from '@/types/task';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
}

export default function YourWorkPage() {
  const router = useRouter();
  const auth = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    completionRate: 0,
  });

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/tasks');
      const tasks = response.data.data || [];
      setAssignedTasks(tasks);
      calculateStats(tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasks: Task[]) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({ total, completed, inProgress, todo, completionRate });
  };

  const handleStartTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to project page
    
    try {
      const response = await axiosInstance.put(`/api/tasks/${taskId}`, {
        status: 'in-progress',
      });

      if (response.data.success) {
        toast.success('Task started! 🚀');
        // Refresh tasks
        fetchAssignedTasks();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to start task';
      toast.error(errorMsg);
    }
  };

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to project page
    
    try {
      const response = await axiosInstance.put(`/api/tasks/${taskId}`, {
        status: 'completed',
      });

      if (response.data.success) {
        toast.success('Task completed! 🎉');
        // Refresh tasks
        fetchAssignedTasks();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to complete task';
      toast.error(errorMsg);
    }
  };

  const getCompletedTasks = () => assignedTasks.filter(t => t.status === 'completed');
  const getActiveTasks = () => assignedTasks.filter(t => t.status !== 'completed');

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 border-gray-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      urgent: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && assignedTasks.find(t => t.dueDate === dueDate)?.status !== 'completed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton height={40} width={250} className="mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} height={120} className="rounded-2xl" />
            ))}
          </div>

          <div className="space-y-6">
            <Skeleton height={300} className="rounded-2xl" />
            <Skeleton height={300} className="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const activeTasks = getActiveTasks();
  const completedTasks = getCompletedTasks();

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Work</h1>
          <p className="text-gray-600">Track your assigned tasks and work progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Tasks */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Tasks Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Tasks</h2>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
              {activeTasks.length} tasks
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No active tasks</p>
              <p className="text-gray-400 text-sm mt-2">All your tasks are completed! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <div
                  key={task._id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-linear-to-r from-white to-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/protected/projects/${task.project?._id}`)}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {isOverdue(task.dueDate) && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Overdue
                        </span>
                      )}
                      {task.status === 'todo' && (
                        <button
                          onClick={(e) => handleStartTask(task._id, e)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                          title="Start working on this task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Start Task
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button
                          onClick={(e) => handleCompleteTask(task._id, e)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                          title="Mark this task as completed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    {task.project && (
                      <span className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full">
                        📁 {task.project.name}
                      </span>
                    )}
                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      📅 Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Completed Tasks</h2>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              {completedTasks.length} tasks
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No completed tasks yet</p>
              <p className="text-gray-400 text-sm mt-2">Start working on your tasks to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => router.push(`/protected/projects/${task.project?._id}`)}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer bg-linear-to-r from-green-50 to-white opacity-90"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3 line-through opacity-75">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    {task.project && (
                      <span className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full">
                        📁 {task.project.name}
                      </span>
                    )}
                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      ✓ Completed: {formatDate(task.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
