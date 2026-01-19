import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { axiosInstance } from '@/lib/axios';
import type { Task } from '@/types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/tasks');
      console.log('useTasks - Fetched tasks:', response.data.data);
      setTasks(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchTasks();
  };

  return { tasks, loading, error, refetch };
}

export function useAssignedTasks() {
  const { data: session } = useSession();
  const { tasks, loading, error, refetch } = useTasks();
  
  // Get current user ID from session
  const currentUserId = (session?.user as any)?.id;
  
  console.log('useAssignedTasks - Current User ID:', currentUserId);
  console.log('useAssignedTasks - Tasks received:', tasks.map(t => ({
    id: t._id,
    title: t.title,
    assignedToId: typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo,
    assignedToName: typeof t.assignedTo === 'object' ? t.assignedTo?.name : 'Unknown'
  })));
  
  // Double-check: filter to only show tasks assigned to current user
  // Backend should already do this, but this is a safety measure
  const assignedTasks = tasks.filter(task => {
    if (!task.assignedTo || !currentUserId) return false;
    
    const assignedToId = typeof task.assignedTo === 'object' 
      ? task.assignedTo._id 
      : task.assignedTo;
    
    const isAssigned = assignedToId === currentUserId;
    
    if (!isAssigned) {
      console.warn('Filtering out task not assigned to current user:', {
        taskTitle: task.title,
        assignedToId,
        currentUserId
      });
    }
    
    return isAssigned;
  });

  console.log('useAssignedTasks - Filtered tasks count:', assignedTasks.length);

  return { assignedTasks, loading, error, refetch };
}
