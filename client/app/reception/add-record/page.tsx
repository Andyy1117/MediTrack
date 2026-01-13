"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type FormData = {
  patient_name: string;
  national_id: string;
  phone: string;
  exam_type: string;
};

const EXAM_TYPES = [
  "MRI Brain",
  "MRI Spine",
  "MRI Knee",
  "MRI Abdomen",
  "CT Head",
  "CT Chest",
  "CT Abdomen",
  "X-Ray",
  "Ultrasound"
];

export default function ReceptionAddRecord() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/exams/register', data);
      toast.success("Patient Registered Successfully!");
      reset(); // Clear form
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Error registering patient");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Patient Registration</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient Name</label>
          <input 
            {...register('patient_name', { required: 'Name is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Full Name" 
          />
          {errors.patient_name && <p className="text-red-500 text-xs mt-1">{errors.patient_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">National ID (RegNo)</label>
          <input 
            {...register('national_id', { required: 'National ID is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="National ID" 
          />
          {errors.national_id && <p className="text-red-500 text-xs mt-1">{errors.national_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input 
            {...register('phone', { required: 'Phone is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Phone Number" 
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Exam Type</label>
          <select 
            {...register('exam_type', { required: 'Exam Type is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Exam Type...</option>
            {EXAM_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.exam_type && <p className="text-red-500 text-xs mt-1">{errors.exam_type.message}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
