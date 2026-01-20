'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import type { Task } from '@/types/task';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  team?: {
    _id: string;
    name: string;
  };
  backlogTasks?: Task[];
}

export default function BacklogPage() {
  const router = useRouter();
  const auth = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsWithBacklog();
  }, []);

  const fetchProjectsWithBacklog = async () => {
    try {
      setLoading(true);
      const projectsResponse = await axiosInstance.get('/api/projects');
      const projectsData = projectsResponse.data.data || [];

      // Fetch tasks for each project and filter backlog tasks
      const projectsWithBacklog = await Promise.all(
        projectsData.map(async (project: Project) => {
          try {
            const tasksResponse = await axiosInstance.get(`/api/tasks/project/${project._id}`);
            const tasks = tasksResponse.data.data || [];
            const now = new Date();
            // Include tasks that are:
            // 1. Status is "backlog" OR
            // 2. Past due date and not completed
            const backlogTasks = tasks.filter((task: Task) => {
              const isDue = task.dueDate && new Date(task.dueDate) < now;
              const isNotCompleted = task.status !== 'completed';
              return task.status === 'backlog' || (isDue && isNotCompleted);
            });
            return { ...project, backlogTasks };
          } catch (error) {
            return { ...project, backlogTasks: [] };
          }
        })
      );

      // Only show projects that have backlog tasks
      const projectsWithBacklogTasks = projectsWithBacklog.filter(p => p.backlogTasks && p.backlogTasks.length > 0);
      setProjects(projectsWithBacklogTasks);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load backlog');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTodo = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await axiosInstance.put(`/api/tasks/${taskId}`, {
        status: 'todo',
      });

      if (response.data.success) {
        toast.success('Task moved to Todo! 📝');
        fetchProjectsWithBacklog();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to move task';
      toast.error(errorMsg);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 border-gray-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      urgent: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getProjectStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      'on-hold': 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date?: string) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton height={40} width={200} className="mb-8" />
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height={300} className="rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Backlog</h1>
          <p className="text-gray-600">Tasks in backlog status and overdue tasks that need attention</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-500 text-xl mb-2">No backlog tasks</p>
            <p className="text-gray-400">All tasks are either in progress or completed</p>
          </div>
        ) : (
          <div className="space-y-8">
            {projects.map((project) => (
              <div key={project._id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Project Header */}
                <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h2 
                      className="text-2xl font-bold cursor-pointer hover:underline"
                      onClick={() => router.push(`/protected/projects/${project._id}`)}
                    >
                      {project.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getProjectStatusColor(project.status)} bg-white`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                      </span>
                      <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold">
                        {project.backlogTasks?.length || 0} tasks
                      </span>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-indigo-100 text-sm">{project.description}</p>
                  )}
                  {project.team && (
                    <div className="mt-2">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                        👥 Team: {project.team.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Backlog Tasks */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.backlogTasks?.map((task) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                      
                      return (
                        <div
                          key={task._id}
                          className={`bg-linear-to-br from-gray-50 to-white border-2 rounded-xl p-5 hover:shadow-lg transition-all ${
                            isOverdue ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                          }`}
                        >
                          {/* Overdue Badge */}
                          {isOverdue && (
                            <div className="mb-3">
                              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                                ⚠️ OVERDUE
                              </span>
                            </div>
                          )}

                          <div 
                            className="cursor-pointer mb-4"
                            onClick={() => router.push(`/protected/projects/${project._id}`)}
                          >
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Priority and Assignment */}
                            <div className="flex items-center justify-between">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                              {task.assignedTo && (
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  👤 {task.assignedTo.name}
                                </span>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                Status: {task.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>

                            {/* Due Date */}
                            {task.dueDate && (
                              <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                📅 Due: {formatDate(task.dueDate)}
                              </div>
                            )}

                            {/* Move to Todo Button */}
                            <button
                              onClick={(e) => handleMoveToTodo(task._id, e)}
                              className="w-full mt-3 px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              Move to Todo
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
