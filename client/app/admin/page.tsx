"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { Trash2, Plus, Users as UsersIcon, Stethoscope } from 'lucide-react';

type Doctor = {
  Doctor_ID: string;
  Name: string;
  Hospital: string;
  Department: string;
  Phone: string;
  Role: string;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'users'>('doctors');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`${
              activeTab === 'doctors'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Stethoscope className="mr-2 h-5 w-5" />
            Doctors Master List
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <UsersIcon className="mr-2 h-5 w-5" />
            System Users
          </button>
        </nav>
      </div>

      {activeTab === 'doctors' ? <DoctorsManager /> : <UsersManager />}
    </div>
  );
}

function DoctorsManager() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post('/doctors', data);
      reset();
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert('Failed to add doctor');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Add Doctor Form */}
      <div className="md:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
        <h2 className="text-lg font-medium mb-4 flex items-center">
            <Plus className="mr-2 h-5 w-5" /> Add New Doctor
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...register('name', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm" placeholder="Dr. Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hospital</label>
            <input {...register('hospital')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm" placeholder="Hospital Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input {...register('department')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm" placeholder="Department" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input {...register('phone')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm" placeholder="Phone" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select {...register('role', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm">
                <option value="Referring">Referring Doctor</option>
                <option value="Reporting">Reporting Radiologist</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Adding...' : 'Add Doctor'}
          </button>
        </form>
      </div>

      {/* Doctors List */}
      <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Registered Doctors</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital/Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {doctors.map((doc, i) => (
                <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.Name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.Hospital} - {doc.Department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.Role === 'Reporting' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {doc.Role}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.Phone}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/get-users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post('/admin/create-user', data);
      reset();
      fetchUsers();
    } catch (err) { alert('Failed'); }
  };

  const handleDelete = async (username: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.post('/admin/delete-user', { username });
      fetchUsers();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-medium mb-4">Create System User</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input {...register('username', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="text" {...register('password', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select {...register('role', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm">
                <option value="receptionist">Receptionist</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              Create User
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
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
              {users.map((u, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.Username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.Role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.Username !== 'admin' && (
                        <button onClick={() => handleDelete(u.Username)} className="text-red-600 hover:text-red-900">
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
  );
}
