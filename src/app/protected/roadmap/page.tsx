'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  tasks?: Task[];
}

export default function RoadmapPage() {
  const router = useRouter();
  const auth = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsWithTasks();
  }, []);

  const fetchProjectsWithTasks = async () => {
    try {
      setLoading(true);
      const projectsResponse = await axiosInstance.get('/api/projects');
      const projectsData = projectsResponse.data.data || [];

      // Fetch tasks for each project
      const projectsWithTasks = await Promise.all(
        projectsData.map(async (project: Project) => {
          try {
            const tasksResponse = await axiosInstance.get(`/api/tasks/project/${project._id}`);
            const tasks = tasksResponse.data.data || [];
            // Sort tasks by priority: urgent > high > medium > low
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            const sortedTasks = tasks.sort((a: Task, b: Task) => {
              return priorityOrder[a.priority as keyof typeof priorityOrder] - 
                     priorityOrder[b.priority as keyof typeof priorityOrder];
            });
            return { ...project, tasks: sortedTasks };
          } catch (error) {
            return { ...project, tasks: [] };
          }
        })
      );

      setProjects(projectsWithTasks);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      urgent: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800' },
      high: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800' },
      medium: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800' },
      low: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-800' },
    };
    return colors[priority] || colors.low;
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

  const getProjectStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-800 border-gray-300',
      active: 'bg-green-100 text-green-800 border-green-300',
      'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          <Skeleton height={40} width={200} className="mb-8" />
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height={400} className="rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Roadmap</h1>
          <p className="text-gray-600">Visual overview of all projects and their task workflows</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-xl mb-2">No projects available</p>
            <p className="text-gray-400">Create your first project to see the roadmap</p>
          </div>
        ) : (
          <div className="space-y-12">
            {projects.map((project, projectIndex) => (
              <div key={project._id} className="relative">
                {/* Project Block */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-200">
                  {/* Project Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-bold">{project.name}</h2>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getProjectStatusColor(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-purple-100 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {project.team && (
                        <span className="px-3 py-1 bg-white/20 rounded-full">
                          👥 Team: {project.team.name}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-white/20 rounded-full">
                        📋 {project.tasks?.length || 0} Tasks
                      </span>
                    </div>
                  </div>

                  {/* Tasks Workflow */}
                  <div className="p-8">
                    {!project.tasks || project.tasks.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-lg">No tasks in this project</p>
                        <p className="text-sm mt-2">Add tasks to see the workflow</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Priority Sections */}
                        <div className="space-y-6">
                          {['urgent', 'high', 'medium', 'low'].map((priority, priorityIndex) => {
                            const tasksInPriority = project.tasks?.filter(t => t.priority === priority) || [];
                            if (tasksInPriority.length === 0) return null;

                            return (
                              <div key={priority} className="relative">
                                {/* Priority Label */}
                                <div className="flex items-center gap-3 mb-4">
                                  <span className={`px-4 py-2 rounded-lg font-bold text-sm uppercase ${getPriorityColor(priority).bg} ${getPriorityColor(priority).text} ${getPriorityColor(priority).border} border-2`}>
                                    🔥 {priority} Priority
                                  </span>
                                  <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                                </div>

                                {/* Tasks in this priority */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 ml-8">
                                  {tasksInPriority.map((task, taskIndex) => (
                                    <div key={task._id} className="relative">
                                      {/* Task Card */}
                                      <div
                                        onClick={() => router.push(`/protected/projects/${project._id}`)}
                                        className={`${getPriorityColor(task.priority).bg} border-2 ${getPriorityColor(task.priority).border} rounded-xl p-4 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1`}
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <h4 className="font-semibold text-gray-900 flex-1 pr-2">{task.title}</h4>
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)} whitespace-nowrap`}>
                                            {task.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                          </span>
                                        </div>

                                        {task.description && (
                                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                          {task.assignedTo && (
                                            <span className="flex items-center gap-1">
                                              👤 {task.assignedTo.name}
                                            </span>
                                          )}
                                          {task.dueDate && (
                                            <span className="flex items-center gap-1">
                                              📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                          )}
                                        </div>

                                        {/* Task number indicator */}
                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center font-bold text-sm text-gray-700 shadow-md">
                                          {taskIndex + 1}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border-2 border-red-400 rounded"></div>
              <span className="text-sm text-gray-700">Urgent Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-200 border-2 border-orange-400 rounded"></div>
              <span className="text-sm text-gray-700">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded"></div>
              <span className="text-sm text-gray-700">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded"></div>
              <span className="text-sm text-gray-700">Low Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
