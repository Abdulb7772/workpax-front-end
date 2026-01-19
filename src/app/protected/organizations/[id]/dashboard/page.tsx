'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { axiosInstance } from '@/lib/axios';
import { useAuth } from '@/lib/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface Organization {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  createdBy: any;
}

interface Project {
  _id: string;
  name: string;
  status: string;
  organization: {
    _id: string;
    name: string;
  };
}

export default function OrganizationDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const auth = useAuth();
  const { setSelectedOrganizationId } = useOrganizationContext();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      setSelectedOrganizationId(params.id as string);
      fetchOrganizationData();
    }
  }, [params.id]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [orgRes, projectsRes] = await Promise.all([
        axiosInstance.get(`/api/organizations/${params.id}`),
        axiosInstance.get(`/api/projects?organizationId=${params.id}`),
      ]);

      setOrganization(orgRes.data.data);
      setProjects(projectsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton height={40} width={300} className="mb-2" />
            <Skeleton height={20} width={200} />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6">
                <Skeleton height={24} width={150} className="mb-2" />
                <Skeleton height={36} width={80} className="mb-2" />
                <Skeleton height={16} width={120} />
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <Skeleton height={28} width={200} className="mb-4" />
            <Skeleton height={300} />
          </div>

          {/* Projects List Skeleton */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <Skeleton height={28} width={150} className="mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton height={24} width={250} className="mb-2" />
                  <Skeleton count={2} className="mb-2" />
                  <div className="flex gap-2">
                    <Skeleton height={24} width={80} />
                    <Skeleton height={24} width={100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-semibold mb-2">Error</p>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/protected/dashboard')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const pendingProjects = projects.filter(p => p.status === 'pending').length;
  const totalMembers = organization?.members?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {organization?.name}
              </h1>
              {organization?.description && (
                <p className="text-gray-600 text-lg">{organization.description}</p>
              )}
            </div>
            {(auth.isAdmin || auth.isManager) && (
              <button
                onClick={() => router.push(`/protected/organizations/${params.id}/manage`)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Manage Organization
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold mt-2">{projects.length}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending Projects</p>
                <p className="text-3xl font-bold mt-2">{pendingProjects}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Team Members</p>
                <p className="text-3xl font-bold mt-2">{totalMembers}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Status Overview</h2>
            <div className="space-y-4">
              {/* Active Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Active</span>
                  <span className="text-sm font-semibold text-green-600">{activeProjects}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${projects.length > 0 ? (activeProjects / projects.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Pending Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                  <span className="text-sm font-semibold text-yellow-600">{pendingProjects}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full transition-all duration-500"
                    style={{ width: `${projects.length > 0 ? (pendingProjects / projects.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Completed Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                  <span className="text-sm font-semibold text-blue-600">{completedProjects}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${projects.length > 0 ? (completedProjects / projects.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{projects.length > 0 ? Math.round((activeProjects / projects.length) * 100) : 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">Active Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">Completion Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Projects</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Projects</h2>
              {(auth.isAdmin || auth.isManager) && (
                <button
                  onClick={() => router.push('/protected/projects/create')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  + New Project
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 text-sm">No projects yet</p>
                </div>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <div
                    key={project._id}
                    onClick={() => router.push(`/protected/projects/${project._id}`)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (auth.isAdmin || auth.isManager) {
                        router.push(`/protected/projects/${project._id}/edit`);
                      }
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    title={auth.isAdmin || auth.isManager ? "Click to view, double-click to edit" : "Click to view"}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              project.status === 'active' || project.status === 'in-progress'
                                ? 'bg-green-100 text-green-700'
                                : project.status === 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}
