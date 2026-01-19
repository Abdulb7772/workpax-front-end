import { NotificationType } from './enums';

export interface Notification {
  _id: string;
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
