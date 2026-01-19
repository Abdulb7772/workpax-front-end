'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/lib/axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: string;
  dueDate?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  team?: {
    _id: string;
    name: string;
  };
}

interface TaskStats {
  backlog: number;
  todo: number;
  'in-progress': number;
  review: number;
  completed: number;
  blocked: number;
  total: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<{ [key: string]: Task[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all projects
      const projectsResponse = await axiosInstance.get('/api/projects');
      const projectsList = projectsResponse.data.data || [];
      setProjects(projectsList);

      // Fetch tasks for each project
      const tasksPromises = projectsList.map((project: Project) =>
        axiosInstance.get(`/api/tasks/project/${project._id}`).then((res) => ({
          projectId: project._id,
          tasks: res.data.data || [],
        }))
      );

      const tasksResults = await Promise.all(tasksPromises);
      const tasksMap: { [key: string]: Task[] } = {};
      tasksResults.forEach((result) => {
        tasksMap[result.projectId] = result.tasks;
      });

      setProjectTasks(tasksMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTaskStats = (tasks: Task[]): TaskStats => {
    const stats: TaskStats = {
      backlog: 0,
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0,
      blocked: 0,
      total: tasks.length,
    };

    tasks.forEach((task) => {
      if (task.status in stats) {
        stats[task.status]++;
      }
    });

    return stats;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'backlog':
        return '#6366f1'; // indigo
      case 'todo':
        return '#3b82f6'; // blue
      case 'in-progress':
        return '#f59e0b'; // amber
      case 'review':
        return '#8b5cf6'; // purple
      case 'completed':
        return '#10b981'; // green
      case 'blocked':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const formatStatusLabel = (status: string): string => {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusProgressWeight = (status: string): number => {
    switch (status) {
      case 'completed':
        return 1.0; // 100% of task's share
      case 'review':
        return 0.30; // 30% of task's share
      case 'in-progress':
        return 0.15; // 15% of task's share
      case 'todo':
        return 0.05; // 5% of task's share
      case 'backlog':
        return 0; // 0% of task's share
      case 'blocked':
        return 0; // 0% of task's share
      default:
        return 0;
    }
  };

  const renderPieChart = (stats: TaskStats, projectId: string) => {
    if (stats.total === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400">
          No tasks available
        </div>
      );
    }

    // Get tasks for this project
    const tasks = projectTasks[projectId] || [];
    
    // Color palette for different tasks
    const taskColors = [
      '#10b981', // green
      '#3b82f6', // blue
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ef4444', // red
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#84cc16', // lime
      '#f97316', // orange
      '#6366f1', // indigo
    ];

    // Each task gets equal share of the project (100% / number of tasks)
    const taskShare = 100 / stats.total;

    // Calculate total progress: each task contributes (taskShare * statusWeight)
    const totalProgressPoints = tasks.reduce((sum, task) => {
      const statusWeight = getStatusProgressWeight(task.status);
      return sum + (taskShare * statusWeight);
    }, 0);

    // Create segments for each individual task based on their contribution
    let currentAngle = -90; // Start from top
    const segments = tasks.map((task, index) => {
      const statusWeight = getStatusProgressWeight(task.status);
      const taskContribution = taskShare * statusWeight; // This task's contribution to overall progress
      const angle = (taskContribution / 100) * 360; // Convert to angle
      const segment = {
        status: task.status,
        title: task.title,
        taskShare,
        statusWeight,
        taskContribution,
        startAngle: currentAngle,
        angle,
        color: taskColors[index % taskColors.length],
      };
      currentAngle += angle;
      return segment;
    }).filter(seg => seg.angle > 0); // Only show tasks that contribute to progress

    // Create SVG path for each segment
    const createArc = (
      startAngle: number,
      angle: number,
      radius: number = 80,
      innerRadius: number = 40
    ) => {
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + angle) * Math.PI) / 180;

      const x1 = 100 + radius * Math.cos(startRad);
      const y1 = 100 + radius * Math.sin(startRad);
      const x2 = 100 + radius * Math.cos(endRad);
      const y2 = 100 + radius * Math.sin(endRad);

      const x3 = 100 + innerRadius * Math.cos(endRad);
      const y3 = 100 + innerRadius * Math.sin(endRad);
      const x4 = 100 + innerRadius * Math.cos(startRad);
      const y4 = 100 + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    };

    return (
      <div className="flex flex-col items-center">
        {/* Pie Chart SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48"
          style={{ overflow: 'visible' }}
        >
          {/* Background circle (unfilled progress) */}
          <circle cx="100" cy="100" r="80" fill="#e5e7eb" />
          
          {segments.map((segment, index) => {
            const path = createArc(segment.startAngle, segment.angle);
            return (
              <path
                key={index}
                d={path}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-300 hover:opacity-90"
              />
            );
          })}
          
          {/* Center circle for donut effect */}
          <circle cx="100" cy="100" r="40" fill="white" stroke="#e5e7eb" strokeWidth="2" />
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-800"
            style={{ fontSize: '24px', fontWeight: 'bold' }}
          >
            {totalProgressPoints.toFixed(0)}%
          </text>
          <text
            x="100"
            y="110"
            textAnchor="middle"
            className="text-xs fill-gray-500"
            style={{ fontSize: '12px' }}
          >
            complete
          </text>
        </svg>

        {/* Legend */}
        <div className="mt-6 w-full space-y-2">
          {tasks.map((task, index) => {
            const taskShare = 100 / stats.total;
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: taskColors[index % taskColors.length] }}
                  />
                  <span className="text-gray-700 font-medium truncate">
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">
                    {formatStatusLabel(task.status)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {(taskShare * getStatusProgressWeight(task.status)).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton height={40} width={200} className="mb-2" />
          <Skeleton height={20} width={300} className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <Skeleton height={30} width={150} className="mb-4" />
                <Skeleton height={200} className="mb-4" />
                <Skeleton count={4} height={20} className="mb-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Project Reports
          </h1>
          <p className="text-gray-600">
            Task distribution and status overview for all projects
          </p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-500">
              Create a project to start tracking tasks and generating reports.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const tasks = projectTasks[project._id] || [];
              const stats = calculateTaskStats(tasks);

              return (
                <div
                  key={project._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Project Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <h2 className="text-xl font-bold mb-1 truncate">
                      {project.name}
                    </h2>
                    {project.team && (
                      <div className="flex items-center gap-2 text-blue-100 text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="truncate">{project.team.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Chart Content */}
                  <div className="p-6">
                    {renderPieChart(stats, project._id)}
                  </div>

                  {/* Project Footer */}
                  <div className="px-6 pb-6">
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium capitalize">
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
