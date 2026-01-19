export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: {
    _id: string;
    name: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  assignedTo: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  dueDate: string;
  estimatedHours?: number;
  tags?: string[];
}
