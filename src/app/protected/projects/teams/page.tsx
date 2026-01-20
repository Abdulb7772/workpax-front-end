"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { toast } from "react-toastify";
import { showConfirmToast } from "@/lib/confirmToast";

interface TeamMember {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: string;
  joinedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  organization: {
    _id: string;
    name: string;
  };
  members: TeamMember[];
  createdBy: {
    _id: string;
    name: string;
  };
}

export default function TeamsPage() {
  const auth = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  useEffect(() => {
    fetchTeams();
    if (auth.isAdmin) {
      fetchOrganizations();
      fetchUsers();
    }
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/teams");
      setTeams(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await axiosInstance.get("/api/organizations");
      setOrganizations(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/api/organizations");
      const allUsers: any[] = [];
      res.data.data?.forEach((org: any) => {
        org.members?.forEach((member: any) => {
          if (!allUsers.find(u => u._id === member.user._id)) {
            allUsers.push(member.user);
          }
        });
      });
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !selectedOrgId) {
      toast.error("Please provide team name and select organization");
      return;
    }

    try {
      // Get current admin user ID from session
      const currentUserId = (auth.session?.user as any)?.id;
      
      // Automatically add the creating admin as team admin
      const initialMembers = currentUserId ? [
        {
          user: currentUserId,
          role: 'admin'
        }
      ] : [];

      await axiosInstance.post("/api/teams", {
        name: newTeamName,
        description: newTeamDescription,
        organizationId: selectedOrgId,
        members: initialMembers,
      });
      toast.success("Team created successfully");
      setShowCreateModal(false);
      setNewTeamName("");
      setNewTeamDescription("");
      setSelectedOrgId("");
      fetchTeams();
    } catch (error: any) {
      console.error("Failed to create team:", error);
      toast.error(error.response?.data?.message || "Failed to create team");
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedTeam) {
      toast.error("Please select a user");
      return;
    }

    try {
      await axiosInstance.post(`/api/teams/${selectedTeam._id}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      toast.success("Member added successfully");
      setShowAddMemberModal(false);
      setSelectedUserId("");
      setSelectedRole("member");
      fetchTeams();
    } catch (error: any) {
      console.error("Failed to add member:", error);
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    showConfirmToast({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the team?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmColor: 'red',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/teams/${teamId}/members/${userId}`);
          toast.success("Member removed successfully");
          fetchTeams();
        } catch (error: any) {
          console.error("Failed to remove member:", error);
          toast.error(error.response?.data?.message || "Failed to remove member");
        }
      },
    });
  };

  const handleUpdateRole = async (teamId: string, userId: string, newRole: string) => {
    try {
      await axiosInstance.patch(`/api/teams/${teamId}/members/${userId}/role`, {
        role: newRole,
      });
      toast.success("Role updated successfully");
      fetchTeams();
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    showConfirmToast({
      title: 'Delete Team',
      message: 'Are you sure you want to delete this team? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'red',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/teams/${teamId}`);
          toast.success("Team deleted successfully");
          fetchTeams();
        } catch (error: any) {
          console.error("Failed to delete team:", error);
          toast.error(error.response?.data?.message || "Failed to delete team");
        }
      },
    });
  };

  const borderColors = [
    'border-blue-400',
    'border-green-400',
    'border-purple-400',
    'border-pink-400',
    'border-orange-400',
    'border-teal-400',
  ];

  const bgColors = [
    'bg-blue-50',
    'bg-green-50',
    'bg-purple-50',
    'bg-pink-50',
    'bg-orange-50',
    'bg-teal-50',
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-600">
          Teams
        </h1>
        {auth.isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            + Create Team
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-lg text-gray-600">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No teams found</p>
          {auth.isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Create Your First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, idx) => (
            <div
              key={team._id}
              className={`rounded-xl shadow-lg p-6 border-l-8 ${bgColors[idx % bgColors.length]} ${borderColors[idx % borderColors.length]} hover:shadow-2xl transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{team.name}</h2>
                  {team.description && (
                    <p className="text-sm text-gray-600">{team.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Organization: {team.organization.name}
                  </p>
                </div>
                {auth.isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMemberModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      title="Add member"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      title="Delete team"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Members ({team.members.length})
                </p>
                {team.members.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No members yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {team.members.map((member) => (
                      <div
                        key={member.user._id}
                        className="flex items-center justify-between bg-white/70 p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">
                            {member.user.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {auth.isAdmin ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(team._id, member.user._id, e.target.value)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="member">Member</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span
                              className="text-xs px-2 py-1 rounded font-medium"
                              style={{
                                background: member.role === 'admin' ? '#dc2626' : member.role === 'manager' ? '#7c3aed' : '#3b82f6',
                                color: 'white'
                              }}
                            >
                              {member.role}
                            </span>
                          )}
                          {auth.isAdmin && (
                            <button
                              onClick={() => handleRemoveMember(team._id, member.user._id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="Remove member"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Team</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateTeam}
                className="flex-1 px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Create Team
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTeamName("");
                  setNewTeamDescription("");
                  setSelectedOrgId("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Add Member to {selectedTeam.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a user</option>
                  {users
                    .filter(u => {
                      // Exclude users already in the team
                      const isAlreadyMember = selectedTeam.members.find(m => m.user._id === u._id);
                      // Exclude the current admin user
                      const currentUserId = (auth.session?.user as any)?.id;
                      const isCurrentAdmin = u._id === currentUserId;
                      return !isAlreadyMember && !isCurrentAdmin;
                    })
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Add Member
              </button>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUserId("");
                  setSelectedRole("member");
                  setSelectedTeam(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
