'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import Dropdown, { DropdownItem, DropdownDivider, DropdownHeader } from './Dropdown';
import { useAuth } from '@/lib/useAuth';
import { useOrganizations } from '@/hooks/useOrganization';
import { useProjects } from '@/hooks/useProjects';
import { useAssignedTasks } from '@/hooks/useTasks';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { axiosInstance } from '@/lib/axios';
import { toast } from 'react-toastify';

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const auth = useAuth();
  const { selectedOrganizationId } = useOrganizationContext();
  const { selectedTeam, selectedTeamRole, setSelectedTeam, clearSelectedTeam } = useTeamContext();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const { projects, loading: projectsLoading } = useProjects(selectedOrganizationId);
  const { assignedTasks, loading: tasksLoading } = useAssignedTasks();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAdmin) {
      fetchTeams();
    }
  }, [auth.isAdmin]);

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await axiosInstance.get('/api/teams');
      setTeams(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const getUserRoleInTeam = (team: any) => {
    const currentUserId = (session?.user as any)?.id;
    const member = team.members?.find((m: any) => m.user._id === currentUserId);
    return member?.role || 'member';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      review: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-20 px-4">
            {/* Left: Hamburger Menu and Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 left-0 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Link href="/protected/dashboard">
                <button className="text-xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent capitalize cursor-pointer hover:opacity-80 transition-opacity">
                  Workpax
                </button>
              </Link>
              {/* Your Work Button */}
              <button
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm"
                onClick={() => router.push('/protected/your-work')}
              >
                Your Work
              </button>
              
              {/* Teams - Button for Admin, Dropdown for Others */}
              {auth.isAdmin ? (
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm"
                  onClick={() => router.push('/protected/projects/teams')}
                >
                  Teams
                </button>
              ) : (
                <Dropdown
                  trigger={(
                    <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm">
                      Teams
                      {selectedTeam && (
                        <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {selectedTeam.name}
                        </span>
                      )}
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                  align="left"
                  width="w-72"
                >
                  {teamsLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Loading teams...
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      You are not a member of any team
                    </div>
                  ) : (
                    <>
                      <DropdownHeader>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 uppercase">Your Teams</p>
                          {selectedTeam && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSelectedTeam();
                                toast.info('Team context cleared');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Clear Selection
                            </button>
                          )}
                        </div>
                      </DropdownHeader>
                      {teams.map((team) => {
                        const isSelected = selectedTeam?._id === team._id;
                        return (
                          <DropdownItem
                            key={team._id}
                            icon={
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
                            }
                            onClick={() => {
                              setSelectedTeam(team);
                              toast.success(`Switched to ${team.name} as ${getUserRoleInTeam(team)}`);
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{team.name}</p>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {team.organization?.name}
                                </span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: getUserRoleInTeam(team) === 'admin' ? '#dc2626' : getUserRoleInTeam(team) === 'manager' ? '#7c3aed' : '#3b82f6',
                                    color: 'white'
                                  }}
                                >
                                  {getUserRoleInTeam(team)}
                                </span>
                              </div>
                            </div>
                          </DropdownItem>
                        );
                      })}
                    </>
                  )}
                </Dropdown>
              )}

              {/* Projects Dropdown */}
              <Dropdown
                trigger={
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm">
                    Projects
                    {selectedOrganizationId && (
                      <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Filtered
                      </span>
                    )}
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                }
                align="left"
                width="w-64"
              >
                {selectedOrganizationId && (
                  <>
                    <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
                      <p className="text-xs text-purple-700 font-medium">
                        Showing projects from selected organization
                      </p>
                    </div>
                  </>
                )}
                {projectsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading projects...
                  </div>
                ) : (
                  <>
                    {projects.length > 0 && (
                      <>
                        <DropdownHeader>
                          <p className="text-xs text-gray-500 uppercase">Your Projects</p>
                        </DropdownHeader>
                        
                        {projects.map((project) => (
                          <DropdownItem
                            key={project._id}
                            icon={
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
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            }
                            onClick={() => {
                              router.push(`/protected/projects/${project._id}`);
                            }}
                          >
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-gray-500">{project.organization.name}</p>
                            </div>
                          </DropdownItem>
                        ))}
                      </>
                    )}

                    {projects.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No projects yet
                      </div>
                    )}

                    {(auth.isAdmin || auth.isManager) && (
                      <>
                        <DropdownDivider />

                        <DropdownItem
                          icon={
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          }
                          onClick={() => {
                            router.push('/protected/projects/create');
                          }}
                        >
                          Create Project
                        </DropdownItem>
                      </>
                    )}
                  </>
                )}
              </Dropdown>

              {/* Assigned Tasks Dropdown */}
              <Dropdown
                trigger={
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm">
                    Assigned Tasks
                    {assignedTasks.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {assignedTasks.length}
                      </span>
                    )}
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                }
                align="left"
                width="w-80"
              >
                {tasksLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading tasks...
                  </div>
                ) : (
                  <>
                    {assignedTasks.length > 0 ? (
                      <>
                        <DropdownHeader>
                          <p className="text-xs text-gray-500 uppercase">Tasks Assigned to You</p>
                        </DropdownHeader>
                        
                        <div className="max-h-96 overflow-y-auto">
                          {assignedTasks.map((task) => (
                            <DropdownItem
                              key={task._id}
                              onClick={() => {
                                router.push(`/protected/projects/${task.project._id}`);
                              }}
                            >
                              <div className="w-full">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-medium text-sm flex-1">{task.title}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                </div>
                                {task.project && (
                                  <p className="text-xs text-gray-500">{task.project.name}</p>
                                )}
                                {task.dueDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </DropdownItem>
                          ))}
                        </div>

                        <DropdownDivider />
                        
                        <DropdownItem
                          icon={
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          }
                          onClick={() => {
                            router.push('/protected/board');
                          }}
                        >
                          View Board
                        </DropdownItem>
                      </>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No tasks assigned to you
                      </div>
                    )}
                  </>
                )}
              </Dropdown>

              {/* Organizations Dropdown */}
              <Dropdown
                trigger={
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm">
                    Organizations
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                }
                align="left"
                width="w-64"
              >
                {orgsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading organizations...
                  </div>
                ) : (
                  <>
                    {/* Header based on role */}
                    {(auth.isAdmin || auth.isManager) && organizations.length > 0 && (
                      <>
                        <DropdownHeader>
                          <p className="text-xs text-gray-500 uppercase">Your Organizations</p>
                        </DropdownHeader>
                        
                        {organizations.map((org) => (
                          <DropdownItem
                            key={org._id}
                            icon={
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
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            }
                            onClick={() => {
                              router.push(`/protected/organizations/${org._id}/dashboard`);
                            }}
                          >
                            {org.name}
                          </DropdownItem>
                        ))}
                      </>
                    )}

                    {/* Member view - show their organization */}
                    {auth.isMember && organizations.length > 0 && (
                      <>
                        <DropdownHeader>
                          <p className="text-xs text-gray-500 uppercase">Your Organization</p>
                        </DropdownHeader>
                        
                        {organizations.slice(0, 1).map((org) => (
                          <DropdownItem
                            key={org._id}
                            icon={
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
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            }
                            onClick={() => {
                              router.push(`/protected/organizations/${org._id}/dashboard`);
                            }}
                          >
                            {org.name}
                          </DropdownItem>
                        ))}
                      </>
                    )}

                    {organizations.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {auth.isAdmin ? 'No organizations yet' : 'Not assigned to any organization'}
                      </div>
                    )}

                    {/* Admin actions */}
                    {auth.isAdmin && (
                      <>
                        <DropdownDivider />

                        <DropdownItem
                          icon={
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          }
                          onClick={() => {
                            router.push('/protected/organizations/create');
                          }}
                        >
                          Create Organization
                        </DropdownItem>
                      </>
                    )}
                  </>
                )}
              </Dropdown>
            </div>

            {/* Right: User Dropdown */}
            <div className="flex items-center gap-3">
              {/* Role Badge - Show team role if team is selected */}
              {selectedTeamRole && (
                <span className="hidden sm:inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize"
                  style={{
                    background: selectedTeamRole === 'admin' ? '#fee2e2' : selectedTeamRole === 'manager' ? '#ede9fe' : '#dbeafe',
                    color: selectedTeamRole === 'admin' ? '#991b1b' : selectedTeamRole === 'manager' ? '#5b21b6' : '#1e40af'
                  }}
                >
                  {selectedTeamRole}
                </span>
              )}

              {/* User Dropdown */}
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-700">
                        {session?.user?.name}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {session?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                }
                align="right"
                width="w-56"
              >
                <DropdownHeader>
                  <p className="text-sm font-semibold text-gray-800">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {session?.user?.email}
                  </p>
                </DropdownHeader>

                <DropdownItem
                  icon={
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                  onClick={() => {
                    router.push('/protected/profile');
                  }}
                >
                  Personal Information
                </DropdownItem>

                <DropdownItem
                  icon={
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  }
                  onClick={() => {
                    router.push('/protected/settings');
                  }}
                >
                  Settings
                </DropdownItem>

                <DropdownDivider />

                <DropdownItem
                  icon={
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  }
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  variant="danger"
                >
                  Logout
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
