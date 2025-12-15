"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type FormData = {
  full_name: string;
  national_id: string;
  age: number;
  gender: string;
  patient_phone: string;
  email?: string;
  emergency_contact?: string;
  scan_type: string;
  contrast: string;
  date_booking: string;
  date_scan: string;
  cancellation_info?: string;
  referral_source: string;
  hospital?: string;
  department?: string;
  doctor_name?: string;
  doctor_phone?: string;
};

export default function ReceptionAddRecord() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedSource = watch('referral_source');
  const showDoctorFields = selectedSource === 'Эмнэлэг';

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await api.post('/reception/add-record', data);
      router.push('/view-records'); // or back to dashboard
      router.refresh();
    } catch (error: any) {
      setSubmitError(error.response?.data?.msg || error.response?.data?.error || 'Бүртгэл хадгалахад алдаа гарлаа');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Шинэ өвчтөн бүртгэх (Ресепшн)</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        {/* Personal Info */}
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Хувийн мэдээлэл</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Овог Нэр</label>
            <input {...register('full_name', { required: 'Нэр оруулна уу' })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" placeholder="Ж: Болд" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Регистр</label>
            <input {...register('national_id', { required: 'Регистр оруулна уу' })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
            {errors.national_id && <p className="text-red-500 text-xs mt-1">{errors.national_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Нас</label>
            <input type="number" {...register('age', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Хүйс</label>
            <select {...register('gender', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm">
                <option value="">Сонгох...</option>
                <option value="Эр">Эр</option>
                <option value="Эм">Эм</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Утас</label>
            <input {...register('patient_phone')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Яаралтай үед холбогдох</label>
            <input {...register('emergency_contact')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Имэйл</label>
            <input {...register('email')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>

        {/* Booking Info */}
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Цаг захиалга</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Шинжилгээний төрөл</label>
                <input {...register('scan_type', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Тодосгогчтой?</label>
                <select {...register('contrast')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm">
                    <option value="No">Үгүй</option>
                    <option value="Yes">Тийм</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Захиалсан огноо</label>
                <input type="date" {...register('date_booking')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Шинжилгээнд орох огноо</label>
                <input type="date" {...register('date_scan')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Цуцлалтын мэдээлэл (хэрэв цуцалсан бол)</label>
                <input {...register('cancellation_info')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
            </div>
        </div>

        {/* Referral Info */}
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Илгээлт</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Эх сурвалж</label>
                <select {...register('referral_source', { required: true })} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm">
                    <option value="Өөрөө">Өөрөө</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Эмнэлэг">Эмнэлэг</option>
                </select>
            </div>
            
            {showDoctorFields && (
                <>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Эмнэлэг</label>
                    <input {...register('hospital')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Тасаг</label>
                    <input {...register('department')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Эмч</label>
                    <input {...register('doctor_name')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Эмчийн утас</label>
                    <input {...register('doctor_phone')} className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" />
                </div>
                </>
            )}
        </div>

        {submitError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{submitError}</p>
            </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </form>
    </div>
  );
}

