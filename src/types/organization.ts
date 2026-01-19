export interface Organization {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  ownerId: string;
  members: OrganizationMember[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: string;
  role: string;
  joinedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
