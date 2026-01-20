"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import type { Notification } from "@/types/notification";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface DashboardStats {
  totalUsers: number | null;
  activeProjects: number;
  pendingTasks: number;
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === "authenticated") {
        try {
          setLoading(true);
          const [statsRes, notificationsRes] = await Promise.all([
            axiosInstance.get("/api/notifications/stats"),
            axiosInstance.get("/api/notifications?limit=10"),
          ]);
          setStats(statsRes.data.data);
          setNotifications(notificationsRes.data.data || []);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    
    // Auto-refresh notifications every 10 seconds
    const interval = setInterval(() => {
      if (status === "authenticated") {
        axiosInstance.get("/api/notifications?limit=10")
          .then(res => setNotifications(res.data.data || []))
          .catch(err => console.error("Error refreshing notifications:", err));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await axiosInstance.get("/api/notifications?limit=10");
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch("/api/notifications/read-all");
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Skeleton height={40} width={400} className="mb-2" />
            <Skeleton height={24} width={300} />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                <Skeleton height={20} width={120} className="mb-2" />
                <Skeleton height={36} width={80} className="mb-2" />
                <Skeleton height={16} width={100} />
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                <Skeleton height={28} width={200} className="mb-4" />
                <Skeleton height={200} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-600">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome to Your Dashboard! 🚀
          </h1>
          <p className="text-gray-600 text-lg">
            Hello, {session?.user?.name || "User"}! You're successfully logged in.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats?.totalUsers !== null && (
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold mt-2">{stats?.activeProjects || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v8h12V6H4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending Tasks</p>
                <p className="text-3xl font-bold mt-2">{stats?.pendingTasks || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold mt-2">{stats?.completionRate || 0}%</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Recent Notifications
            </h2>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {notifications.filter(n => !n.isRead).length} new
                </span>
              )}
              {notifications.filter(n => !n.isRead).length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  title="Mark all as read"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={refreshNotifications}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh notifications"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-2">You'll see activity updates here for all team actions</p>
              <p className="text-gray-400 text-sm mt-1">(Including your own actions for tracking purposes)</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border-l-4 transition-all cursor-pointer ${
                    notification.isRead
                      ? "bg-gray-50 border-gray-300 hover:bg-gray-100"
                      : "bg-blue-50 border-blue-500 hover:bg-blue-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{notification.title}</p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        {notification.metadata?.actorName && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              by {notification.metadata.actorName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {notification.type === ("status_changed" as any) && notification.metadata && (
                      <div className="ml-4 text-xs">
                        <span className="px-2 py-1 rounded bg-gray-200 text-gray-700">
                          {notification.metadata.oldStatus}
                        </span>
                        <span className="mx-1">→</span>
                        <span className="px-2 py-1 rounded bg-green-200 text-green-700">
                          {notification.metadata.newStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity - Show task summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Task Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-700">Total Tasks</p>
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-blue-900">{stats?.totalTasks || 0}</p>
            </div>
            
            <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-700">Completed</p>
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-green-900">{stats?.completedTasks || 0}</p>
            </div>
            
            <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-yellow-900">{stats?.pendingTasks || 0}</p>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}
