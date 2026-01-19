import { useState, useEffect } from 'react';
import { axiosInstance } from '@/lib/axios';

interface Organization {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/organizations');
      setOrganizations(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const refetch = () => {
    fetchOrganizations();
  };

  return {
    organizations,
    loading,
    error,
    refetch,
  };
};
