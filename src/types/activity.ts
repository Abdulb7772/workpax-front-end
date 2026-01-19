import { ActivityType } from './enums';

export interface Activity {
  _id: string;
  type: ActivityType;
  userId: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  organizationId: string;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
