"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Stethoscope } from 'lucide-react';

type Doctor = {
  id: number;
  name: string;
  hospital?: string;
  phone?: string;
  license_no?: string;
  role?: string;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const roleLabel = (role?: string) => {
    if (!role) return '-';
    const normalized = role.toLowerCase();
    if (normalized === 'referring') return 'Илгээгч';
    if (normalized === 'reporting') return 'Тайлан бичигч';
    return role;
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      const message = (err as any)?.response?.data?.msg || 'Эмчийн жагсаалт ачаалж чадсангүй';
      toast.error(message);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post('/doctors', data);
      toast.success('Эмч нэмэгдлээ');
      reset();
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error('Эмч нэмэхэд алдаа гарлаа');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Эмчийн бүртгэл</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <Plus className="mr-2 h-5 w-5" /> Эмч нэмэх
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Нэр</label>
              <input
                {...register('name', { required: true })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
                placeholder="Эмчийн нэр"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Эмнэлэг</label>
              <input
                {...register('hospital')}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
                placeholder="Эмнэлгийн нэр"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Утас</label>
              <input
                {...register('phone')}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
                placeholder="+976..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Лицензийн №</label>
              <input
                {...register('license_no')}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
                placeholder="Лицензийн дугаар"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Үүрэг</label>
              <select
                {...register('role', { required: true })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm sm:text-sm"
              >
                <option value="Referring">Илгээгч</option>
                <option value="Reporting">Тайлан бичигч</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Хадгалж байна...' : 'Эмч нэмэх'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-medium">Бүртгэлтэй эмч нар</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Нэр</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Эмнэлэг</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Утас</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Лиценз</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Үүрэг</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.hospital || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.license_no || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{roleLabel(doc.role)}</td>
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


