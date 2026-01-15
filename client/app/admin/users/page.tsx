"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2, Users } from 'lucide-react';

type UserRow = {
  username: string;
  role: 'Reception' | 'Technician' | 'Admin';
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post('/admin/users', data);
      toast.success('User created');
      reset();
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create user');
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete('/admin/users', { data: { username } });
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-medium mb-4">Create System User</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                {...register('username', { required: true })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...register('password', { required: true })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...register('role', { required: true })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
              >
                <option value="Reception">Reception</option>
                <option value="Technician">Technician</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-medium">System Users</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.username}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.username !== 'admin' && (
                      <button onClick={() => handleDelete(u.username)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


