import { useState, useEffect } from 'react';
import { axiosInstance } from '@/lib/axios';

interface Project {
  _id: string;
  name: string;
  description?: string;
  organization: {
    _id: string;
    name: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const useProjects = (organizationId?: string | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = organizationId 
        ? `/api/projects?organizationId=${organizationId}`
        : '/api/projects';
      const response = await axiosInstance.get(url);
      setProjects(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [organizationId]);

  const refetch = () => {
    fetchProjects();
  };

  return {
    projects,
    loading,
    error,
    refetch,
  };
};
