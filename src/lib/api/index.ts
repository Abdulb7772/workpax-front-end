import { axiosInstance } from '../axios';

export const getCurrentUser = async () => {
	const res = await axiosInstance.get('/api/auth/me');
	return res.data.user;
};

export const updateUsername = async (name: string) => {
	const res = await axiosInstance.put('/api/auth/update-username', { name });
	return res.data;
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
	const res = await axiosInstance.put('/api/auth/update-password', { currentPassword, newPassword });
	return res.data;
};

export const updateEmail = async (newEmail: string) => {
	const res = await axiosInstance.put('/api/auth/update-email', { newEmail });
	return res.data;
};
