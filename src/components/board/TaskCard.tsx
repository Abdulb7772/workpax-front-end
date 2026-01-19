'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  getPriorityColor: (priority: string) => string;
  getStatusBorderColor: (status: string) => string;
  onDoubleClick?: (taskId: string) => void;
}

export default function TaskCard({ task, getPriorityColor, getStatusBorderColor, onDoubleClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(task._id);
      }}
      className={`bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-grab active:cursor-grabbing border-l-4 ${
        isDragging ? 'z-50 rotate-3' : ''
      }`}
      style={{
        ...style,
        borderLeftColor: getStatusBorderColor(task.status),
      }}
    >
      {/* Task Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority.toUpperCase()}
        </span>
        
        {task.estimatedHours && (
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
            ⏱️ {task.estimatedHours}h
          </span>
        )}
      </div>

      {/* Assigned User */}
      {task.assignedTo && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-linear-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {task.assignedTo.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-600 font-medium truncate">
            {task.assignedTo.name}
          </span>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
        {task.startDate && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(task.startDate)}</span>
          </div>
        )}
        {task.dueDate && (
          <div className={`flex items-center gap-1 ${
            new Date(task.dueDate) < new Date() && task.status !== 'completed'
              ? 'text-red-600 font-semibold'
              : ''
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Due {formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
