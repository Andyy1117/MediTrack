"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useState, Suspense } from 'react';

function TechnicianUpdateRecordContent() {
  const searchParams = useSearchParams();
  const nationalId = searchParams.get('id');
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    try {
      // Include the ID to identify the record
      await api.post('/technician/update-record', { ...data, national_id: nationalId });
      router.push('/technician/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  if (!nationalId) return <div>ID not provided</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Шинжилгээний мэдээлэл оруулах (Техникч)</h1>
      <div className="mb-4 text-sm text-gray-500">Өвчтөний ID: {nationalId}</div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Эмнэлзүйн тэмдэглэл</label>
          <textarea {...register('clinical_notes')} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Техникчийн нэр</label>
          <input {...register('technician_name')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Зургийн чанар / Тэмдэглэл</label>
          <input {...register('scan_quality')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Зураг/CD-г Гаргаж Өгсөн Огноо/Цаг</label>
          <input type="datetime-local" {...register('image_release_date')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Хариуны төлөв</label>
            <select {...register('result_status')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
            </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Эмч (Radiologist)</label>
          <input {...register('radiologist_name')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Хадгалах
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TechnicianUpdateRecord() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <TechnicianUpdateRecordContent />
    </Suspense>
  );
}

