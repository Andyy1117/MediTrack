"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type FormData = {
  name: string;
  id: string;
  age: number;
  gender: string;
  patient_phone: string;
  clinical_info: string;
  scan_type: string;
  contrast: string;
  technician: string;
  cd_status: string;
  result_status: string;
  source: string;
  hospital?: string;
  department?: string;
  doctor?: string;
  phone?: string;
  notes?: string;
};

export default function AddPatient() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedSource = watch('source');
  const showDoctorFields = selectedSource === 'Эмнэлэг'; // Updated to Mongolian value

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await api.post('/add-patient', data);
      router.push('/view-records');
      router.refresh();
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || 'Өвчтөн нэмэхэд алдаа гарлаа');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Шинэ өвчтөн бүртгэх</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Овог Нэр</label>
            <input 
              {...register('name', { required: 'Нэр оруулна уу' })}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Ж: Болд"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Регистр / ID</label>
            <input 
              {...register('id', { required: 'ID оруулна уу' })}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Ж: УБ90010101"
            />
            {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Нас</label>
            <input 
              type="number"
              {...register('age', { required: 'Нас оруулна уу' })}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
             {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Хүйс</label>
            <select 
              {...register('gender', { required: 'Хүйс сонгоно уу' })}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Сонгох...</option>
              <option value="Эр">Эр</option>
              <option value="Эм">Эм</option>
            </select>
             {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Өвчтөний утас</label>
            <input 
              {...register('patient_phone')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Ж: 9911-xxxx"
            />
          </div>
        </div>

        {/* Clinical Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Эмнэлзүйн мэдээлэл</label>
          <textarea 
            {...register('clinical_info')}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="Товч зовиур, онош..."
          ></textarea>
        </div>

        {/* Scan Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Шинжилгээний төрөл</label>
            <input 
              {...register('scan_type', { required: 'Төрөл оруулна уу' })}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Ж: MRI Тархи"
            />
             {errors.scan_type && <p className="text-red-500 text-xs mt-1">{errors.scan_type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Тодосгогчтой эсэх</label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="Тийм" 
                  {...register('contrast')}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2">Тийм</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="Үгүй" 
                  {...register('contrast')}
                  defaultChecked
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2">Үгүй</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Лаборант / Техникч</label>
            <input 
              {...register('technician')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Ж: Бат"
            />
          </div>
        </div>

        {/* Status Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">CD Хүлээлгэн өгсөн?</label>
                <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                    <input 
                    type="radio" 
                    value="Тийм" 
                    {...register('cd_status')}
                    className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Тийм</span>
                </label>
                <label className="inline-flex items-center">
                    <input 
                    type="radio" 
                    value="Үгүй" 
                    {...register('cd_status')}
                    defaultChecked
                    className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Үгүй</span>
                </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Хариу гарсан?</label>
                <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                    <input 
                    type="radio" 
                    value="Тийм" 
                    {...register('result_status')}
                    className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Тийм</span>
                </label>
                <label className="inline-flex items-center">
                    <input 
                    type="radio" 
                    value="Үгүй" 
                    {...register('result_status')}
                    defaultChecked
                    className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Үгүй</span>
                </label>
                </div>
            </div>
        </div>

        {/* Source & Doctor Info */}
        <div className="border-t pt-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Илгээсэн эх сурвалж</label>
                <select 
                {...register('source', { required: 'Эх сурвалж сонгоно уу' })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                <option value="Өөрөө">Өөрөө</option>
                <option value="Facebook">Facebook</option>
                <option value="Эмнэлэг">Эмнэлэг</option>
                </select>
            </div>

            {showDoctorFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Эмнэлгийн нэр</label>
                        <input 
                        {...register('hospital', { required: showDoctorFields ? 'Эмнэлгийн нэр оруулна уу' : false })}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                         {errors.hospital && <p className="text-red-500 text-xs mt-1">{errors.hospital.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Тасаг</label>
                        <input 
                        {...register('department')}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Эмчийн нэр</label>
                        <input 
                        {...register('doctor', { required: showDoctorFields ? 'Эмчийн нэр оруулна уу' : false })}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                         {errors.doctor && <p className="text-red-500 text-xs mt-1">{errors.doctor.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Эмчийн утас</label>
                        <input 
                        {...register('phone')}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Тэмдэглэл</label>
          <textarea 
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          ></textarea>
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
