"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/get-users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: any) => {
    setMessage('');
    setError('');
    try {
      await api.post('/admin/create-user', data);
      setMessage('Хэрэглэгч амжилттай үүслээ');
      reset();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Алдаа гарлаа');
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm('Та энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?')) return;
    try {
      await api.post('/admin/delete-user', { username });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Админ самбар</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Шинэ хэрэглэгч үүсгэх</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Нэвтрэх нэр</label>
              <input 
                {...register('username', { required: true })} 
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Нууц үг</label>
              <input 
                type="text" 
                {...register('password', { required: true })} 
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Үүрэг (Role)</label>
              <select 
                {...register('role', { required: true })} 
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
              >
                <option value="receptionist">Receptionist (Ресепшн)</option>
                <option value="technician">Technician (Техникч)</option>
                <option value="admin">Admin (Админ)</option>
              </select>
            </div>

            {message && <div className="text-green-600 text-sm">{message}</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitting ? 'Үүсгэж байна...' : 'Хэрэглэгч үүсгэх'}
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Хэрэглэгчийн жагсаалт</h2>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u, i) => (
                  <tr key={i}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{u.Username}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{u.Role}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.Username !== 'admin' && (
                            <button 
                                onClick={() => handleDelete(u.Username)}
                                className="text-red-600 hover:text-red-900"
                            >
                                Устгах
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
    </div>
  );
}

