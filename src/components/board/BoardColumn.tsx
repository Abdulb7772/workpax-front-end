'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/types/task';
import TaskCard from './TaskCard';

interface BoardColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  getPriorityColor: (priority: string) => string;
  getStatusBorderColor: (status: string) => string;
  onTaskDoubleClick?: (taskId: string) => void;
}

export default function BoardColumn({ id, title, color, tasks, getPriorityColor, getStatusBorderColor, onTaskDoubleClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-80 ${color} rounded-xl p-4 transition-all ${
        isOver ? 'ring-4 ring-purple-400 scale-105' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 shadow">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-100">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white bg-opacity-50">
              <p className="text-sm text-gray-500">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard 
                key={task._id} 
                task={task} 
                getPriorityColor={getPriorityColor} 
                getStatusBorderColor={getStatusBorderColor}
                onDoubleClick={onTaskDoubleClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
