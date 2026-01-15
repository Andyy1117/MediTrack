"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type FormData = {
  first_name: string;
  last_name: string;
  national_id: string;
  age?: number;
  gender?: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;

  exam_type: string;
  exam_date?: string;
  time_slot?: string;
  has_contrast?: boolean;
  price?: number;
  discount?: number;
  payment_status?: string;
  payment_method?: string;
  info_source?: string;
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

const PAYMENT_STATUSES = ["Paid", "Partial", "Unpaid"];
const PAYMENT_METHODS = ["Cash", "Card", "Transfer"];
const INFO_SOURCES = ["Referred", "Facebook", "Walk-in", "Instagram", "Other"];

export default function ReceptionAddRecord() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [saving, setSaving] = useState(false);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      let patientId: number | null = null;
      try {
        const patientRes = await api.post('/patients', {
          first_name: data.first_name,
          last_name: data.last_name,
          national_id: data.national_id,
          age: data.age,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address,
          emergency_contact: data.emergency_contact
        });
        patientId = patientRes.data.id;
      } catch (err: any) {
        if (err.response?.status === 409) {
          const existing = await api.get('/patients/by-national-id', {
            params: { national_id: data.national_id }
          });
          patientId = existing.data.id;
        } else {
          throw err;
        }
      }

      await api.post('/exams/register', {
        patient_id: patientId,
        exam_type: data.exam_type,
        exam_date: data.exam_date,
        time_slot: data.time_slot,
        has_contrast: data.has_contrast || false,
        price: data.price,
        discount: data.discount,
        payment_status: data.payment_status,
        payment_method: data.payment_method,
        info_source: data.info_source
      });

      toast.success("Patient and exam registered!");
      reset(); // Clear form
    } catch (error: any) {
      const message = error.response?.data?.msg || error.response?.data?.error || "Error registering patient";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Register Patient & Exam</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h2>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input 
            {...register('first_name', { required: 'First name is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="First name" 
          />
          {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input 
            {...register('last_name', { required: 'Last name is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Last name" 
          />
          {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">National ID (Reg No)</label>
          <input 
            {...register('national_id', { required: 'National ID is required' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="National ID" 
          />
          {errors.national_id && <p className="text-red-500 text-xs mt-1">{errors.national_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input 
              type="number"
              {...register('age')} 
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
              placeholder="Age" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select 
              {...register('gender')} 
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
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
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email"
            {...register('email')} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Email" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input 
            {...register('address')} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Address" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
          <input 
            {...register('emergency_contact')} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Emergency Contact" 
          />
        </div>

        <div className="pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h2>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Exam Date</label>
            <input
              type="date"
              {...register('exam_date')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Slot</label>
            <input
              {...register('time_slot')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
              placeholder="09:00 - 10:00"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('has_contrast')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
          <label className="text-sm text-gray-700">Contrast Required</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              {...register('price')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount</label>
            <input
              type="number"
              {...register('discount')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Status</label>
            <select
              {...register('payment_status')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select...</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              {...register('payment_method')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select...</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Info Source</label>
          <select
            {...register('info_source')}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select...</option>
            {INFO_SOURCES.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || saving}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting || saving ? 'Saving...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
