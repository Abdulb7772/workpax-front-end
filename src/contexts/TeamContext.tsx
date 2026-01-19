'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface TeamMember {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  role: string;
}

interface Team {
  _id: string;
  name: string;
  organization: {
    _id: string;
    name: string;
  };
  members: TeamMember[];
}

interface TeamContextType {
  selectedTeam: Team | null;
  selectedTeamRole: string | null;
  setSelectedTeam: (team: Team | null) => void;
  clearSelectedTeam: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [selectedTeam, setSelectedTeamState] = useState<Team | null>(null);
  const [selectedTeamRole, setSelectedTeamRole] = useState<string | null>(null);

  useEffect(() => {
    // Load selected team from localStorage on mount
    const savedTeamId = localStorage.getItem('selectedTeamId');
    const savedTeam = localStorage.getItem('selectedTeam');
    
    if (savedTeamId && savedTeam) {
      try {
        const team = JSON.parse(savedTeam);
        setSelectedTeamState(team);
        updateTeamRole(team);
      } catch (error) {
        console.error('Failed to parse saved team:', error);
        localStorage.removeItem('selectedTeamId');
        localStorage.removeItem('selectedTeam');
      }
    }
  }, [session]);

  const updateTeamRole = (team: Team | null) => {
    if (!team || !session) {
      setSelectedTeamRole(null);
      return;
    }

    const currentUserId = (session.user as any)?.id;
    const member = team.members?.find((m) => m.user._id === currentUserId);
    setSelectedTeamRole(member?.role || null);
  };

  const setSelectedTeam = (team: Team | null) => {
    setSelectedTeamState(team);
    updateTeamRole(team);
    
    if (team) {
      localStorage.setItem('selectedTeamId', team._id);
      localStorage.setItem('selectedTeam', JSON.stringify(team));
    } else {
      localStorage.removeItem('selectedTeamId');
      localStorage.removeItem('selectedTeam');
    }
  };

  const clearSelectedTeam = () => {
    setSelectedTeamState(null);
    setSelectedTeamRole(null);
    localStorage.removeItem('selectedTeamId');
    localStorage.removeItem('selectedTeam');
  };

  return (
    <TeamContext.Provider
      value={{
        selectedTeam,
        selectedTeamRole,
        setSelectedTeam,
        clearSelectedTeam,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
}
