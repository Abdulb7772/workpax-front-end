'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OrganizationContextType {
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (id: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  return (
    <OrganizationContext.Provider value={{ selectedOrganizationId, setSelectedOrganizationId }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizationContext = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
};
