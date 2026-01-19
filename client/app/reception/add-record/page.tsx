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
  { value: "MRI Brain", label: "MRI Тархи" },
  { value: "MRI Spine", label: "MRI Нуруу" },
  { value: "MRI Knee", label: "MRI Өвдөг" },
  { value: "MRI Abdomen", label: "MRI Хэвлий" },
  { value: "CT Head", label: "CT Толгой" },
  { value: "CT Chest", label: "CT Цээж" },
  { value: "CT Abdomen", label: "CT Хэвлий" },
  { value: "X-Ray", label: "Рентген" },
  { value: "Ultrasound", label: "Хэт авиан" }
];

const PAYMENT_STATUSES = [
  { value: "Paid", label: "Төлсөн" },
  { value: "Partial", label: "Хэсэгчлэн" },
  { value: "Unpaid", label: "Төлөөгүй" }
];
const PAYMENT_METHODS = [
  { value: "Cash", label: "Бэлэн" },
  { value: "Card", label: "Карт" },
  { value: "Transfer", label: "Шилжүүлэг" }
];
const INFO_SOURCES = [
  { value: "Referred", label: "Илгээсэн" },
  { value: "Facebook", label: "Facebook" },
  { value: "Walk-in", label: "Өөрөө ирсэн" },
  { value: "Instagram", label: "Instagram" },
  { value: "Other", label: "Бусад" }
];

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

      toast.success("Өвчтөн ба шинжилгээ амжилттай бүртгэгдлээ!");
      reset(); // Clear form
    } catch (error: any) {
      const message = error.response?.data?.msg || error.response?.data?.error || "Өвчтөн бүртгэхэд алдаа гарлаа";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Өвчтөн ба шинжилгээ бүртгэх</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Өвчтөний мэдээлэл</h2>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Нэр</label>
          <input 
            {...register('first_name', { required: 'Нэр заавал шаардлагатай' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Нэр" 
          />
          {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Овог</label>
          <input 
            {...register('last_name', { required: 'Овог заавал шаардлагатай' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Овог" 
          />
          {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Регистр / Иргэний үнэмлэх</label>
          <input 
            {...register('national_id', { required: 'Регистр заавал шаардлагатай' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Регистр" 
          />
          {errors.national_id && <p className="text-red-500 text-xs mt-1">{errors.national_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Нас</label>
            <input 
              type="number"
              {...register('age')} 
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
              placeholder="Нас" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Хүйс</label>
            <select 
              {...register('gender')} 
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Сонгох...</option>
              <option value="Male">Эр</option>
              <option value="Female">Эм</option>
              <option value="Other">Бусад</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Утасны дугаар</label>
          <input 
            {...register('phone', { required: 'Утас заавал шаардлагатай' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Утасны дугаар" 
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Имэйл</label>
          <input 
            type="email"
            {...register('email')} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Имэйл" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Хаяг</label>
          <input 
            {...register('address')} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Хаяг" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Яаралтай холбоо барих хүн</label>
          <input 
            {...register('emergency_contact')} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm" 
            placeholder="Яаралтай холбоо барих хүн" 
          />
        </div>

        <div className="pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Шинжилгээний мэдээлэл</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Шинжилгээний төрөл</label>
          <select 
            {...register('exam_type', { required: 'Шинжилгээний төрөл заавал шаардлагатай' })} 
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Төрөл сонгох...</option>
            {EXAM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.exam_type && <p className="text-red-500 text-xs mt-1">{errors.exam_type.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Шинжилгээний огноо</label>
            <input
              type="date"
              {...register('exam_date')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Цагийн интервал</label>
            <input
              {...register('time_slot')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
              placeholder="09:00 - 10:00"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('has_contrast')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
          <label className="text-sm text-gray-700">Тодосгогч шаардлагатай</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Үнэ</label>
            <input
              type="number"
              {...register('price')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Хөнгөлөлт</label>
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
            <label className="block text-sm font-medium text-gray-700">Төлбөрийн төлөв</label>
            <select
              {...register('payment_status')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Сонгох...</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Төлбөрийн хэлбэр</label>
            <select
              {...register('payment_method')}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Сонгох...</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Эх сурвалж</label>
          <select
            {...register('info_source')}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm text-gray-900 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Сонгох...</option>
            {INFO_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>{source.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || saving}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting || saving ? 'Хадгалж байна...' : 'Өвчтөн бүртгэх'}
          </button>
        </div>
      </form>
    </div>
  );
}
