'use client';

import { useState, useEffect } from 'react';
import { axiosInstance } from '@/lib/axios';
import { toast } from 'react-toastify';
import type { Task } from '@/types/task';

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  replies?: Comment[];
  createdAt: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onTaskUpdated?: () => void;
}

export default function TaskModal({ isOpen, onClose, taskId, onTaskUpdated }: TaskModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
  });

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
      fetchComments();
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}`);
      const taskData = response.data.data || response.data;
      setTask(taskData);
      setEditForm({
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || '',
        priority: taskData.priority || '',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axiosInstance.get(`/api/comments/task/${taskId}`);
      setComments(response.data.data || response.data || []);
    } catch (error: any) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleUpdateTask = async () => {
    try {
      await axiosInstance.put(`/api/tasks/${taskId}`, editForm);
      toast.success('Task updated successfully!');
      setIsEditing(false);
      fetchTaskDetails();
      onTaskUpdated?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await axiosInstance.post(`/api/comments/task/${taskId}`, {
        content: newComment,
      });
      toast.success('Comment added!');
      setNewComment('');
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleReplyToComment = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    try {
      await axiosInstance.post(`/api/comments/${commentId}/reply`, {
        content: replyContent,
      });
      toast.success('Reply added!');
      setReplyContent('');
      setReplyTo(null);
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'backlog':
        return 'bg-orange-100 text-orange-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Comments ({comments.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800">{task?.title}</h3>
                )}
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  {isEditing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(task?.status || '')}`}>
                      {task?.status?.replace('-', ' ')}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  {isEditing ? (
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border capitalize ${getPriorityColor(task?.priority || '')}`}>
                      {task?.priority}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-600">{task?.description || 'No description'}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-600">{task?.dueDate ? formatDate(task.dueDate) : 'No due date'}</p>
                )}
              </div>

              {/* Assigned To */}
              {task?.assignedTo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{task.assignedTo.name}</p>
                      <p className="text-sm text-gray-500">{task.assignedTo.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Actions */}
              <div className="flex gap-3 pt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdateTask}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Edit Task
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium shrink-0">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{comment.user.name}</span>
                            <span className="text-sm text-gray-500">{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          
                          {/* Reply Button */}
                          <button
                            onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {replyTo === comment._id ? 'Cancel' : 'Reply'}
                          </button>

                          {/* Reply Form */}
                          {replyTo === comment._id && (
                            <div className="mt-3">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <button
                                onClick={() => handleReplyToComment(comment._id)}
                                disabled={!replyContent.trim()}
                                className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Post Reply
                              </button>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-300">
                              {comment.replies.map((reply) => (
                                <div key={reply._id} className="flex items-start gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-sm shrink-0">
                                    {reply.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-800 text-sm">{reply.user.name}</span>
                                      <span className="text-xs text-gray-500">{formatDateTime(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
