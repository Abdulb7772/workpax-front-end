'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';

import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import type { Task } from '@/types/task';
import BoardColumn from '@/components/board/BoardColumn';
import TaskModal from '@/components/TaskModal';

interface Project {
  _id: string;
  name: string;
  organization: {
    _id: string;
    name: string;
  };
}

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-orange-100', borderColor: '#f97316' },
  { id: 'todo', title: 'To Do', color: 'bg-gray-100', borderColor: '#9ca3af' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100', borderColor: '#3b82f6' },
  { id: 'review', title: 'Review', color: 'bg-purple-100', borderColor: '#a855f7' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100', borderColor: '#22c55e' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100', borderColor: '#ef4444' },
] as const;

export default function BoardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/projects');
      const projectList = response.data.data || [];
      setProjects(projectList);
      
      if (projectList.length > 0) {
        setSelectedProjectId(projectList[0]._id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/project/${projectId}`);
      const taskList = response.data.data || [];
      setTasks(taskList);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await axiosInstance.put(`/api/tasks/${taskId}`, {
        status: newStatus,
      });
      toast.success('Task status updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      // Revert on error
      if (selectedProjectId) {
        fetchTasks(selectedProjectId);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Check if it's a valid column
    const isValidColumn = COLUMNS.some((col) => col.id === newStatus);
    if (!isValidColumn) return;

    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Check if task should be in backlog
    if (task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If due within 1 day or overdue and trying to move out of backlog, show warning
      if (diffDays <= 1 && newStatus !== 'backlog') {
        if (diffDays < 0) {
          toast.error('This task is overdue! Complete it urgently or update the due date.');
        } else {
          toast.warning('This task is urgent (due within 1 day). Complete it soon!');
        }
        // Still allow the move but show warning
      }
    }

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t._id === taskId ? { ...t, status: newStatus as Task['status'] } : t
      )
    );

    // Update on server
    updateTaskStatus(taskId, newStatus);
  };

  const getTasksByStatus = (status: string) => {
    // For backlog, show tasks with due date within 1 day or overdue (as suggestions)
    if (status === 'backlog') {
      return tasks.filter((task) => {
        if (!task.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Show tasks with 1 day or less remaining (including overdue - negative days)
        // These are suggested for backlog but users can move them out
        return diffDays <= 1;
      });
    }
    // For other columns, show tasks by their actual status
    // Users can manually move urgent tasks to other columns if needed
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700 border-gray-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdated = () => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  };

  const getStatusBorderColor = (status: string) => {
    const column = COLUMNS.find(col => col.id === status);
    return column?.borderColor || '#9ca3af';
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton height={40} width={200} className="mb-6" />
          <Skeleton height={50} width={300} className="mb-8" />
          <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="shrink-0 w-80">
                <Skeleton height={400} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Task Board</h1>
          
          {/* Project Selector */}
          {projects.length > 0 ? (
            <div className="flex items-center gap-4">
              <label htmlFor="project-select" className="text-lg font-medium text-gray-700">
                Project:
              </label>
              <select
                id="project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 font-medium"
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.organization.name})
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => router.push(`/protected/projects/${selectedProjectId}`)}
                className="ml-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                View Project Details
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No projects found</p>
              <button
                onClick={() => router.push('/protected/projects/create')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Create Project
              </button>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        {selectedProjectId && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4">
              {COLUMNS.map((column) => (
                <BoardColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  tasks={getTasksByStatus(column.id)}
                  getPriorityColor={getPriorityColor}
                  getStatusBorderColor={getStatusBorderColor}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="rotate-3 opacity-80">
                  <div className="bg-white p-4 rounded-lg shadow-lg border-l-4" style={{ borderColor: getStatusBorderColor(activeTask.status) }}>
                    <h3 className="font-semibold text-gray-900 mb-2">{activeTask.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(activeTask.priority)}`}>
                      {activeTask.priority}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Empty State */}
        {selectedProjectId && tasks.length === 0 && !loading && (
          <div className="text-center py-20">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <p className="text-xl text-gray-600 mb-2">No tasks in this project yet</p>
            <p className="text-gray-500 mb-6">
              Create tasks in the project details page to see them here
            </p>
            <button
              onClick={() => router.push(`/protected/projects/${selectedProjectId}`)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Go to Project
            </button>
          </div>
        )}
      </div>
      
      {/* Task Modal */}
      {selectedTaskId && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          taskId={selectedTaskId}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}
