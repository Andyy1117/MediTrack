"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');
  const { login } = useAuth();

  const onSubmit = async (data: any) => {
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      const { access_token, role } = response.data;
      login(access_token, role, data.username);
      toast.success("Successfully logged in!");
    } catch (err: any) {
      const msg = err.response?.data?.msg || 'Login failed';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/90 shadow-xl ring-1 ring-slate-200 px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <img src="/anke-mri-logo.svg" alt="Anke MRI" className="h-10 w-10" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Anke MRI</h1>
            <p className="mt-1 text-sm text-slate-500">Medical Center</p>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
              Нэвтрэх
            </h2>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">Хэрэглэгчийн нэр</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...register('username', { required: 'Хэрэглэгчийн нэр оруулна уу' })}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:text-sm"
                  placeholder="Хэрэглэгчийн нэр"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500">{String(errors.username.message)}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Нууц үг</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password', { required: 'Нууц үг оруулна уу' })}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:text-sm"
                  placeholder="Нууц үг"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{String(errors.password.message)}</p>
                )}
              </div>
            </div>

            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center rounded-md bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Secure access to imaging records
        </p>
      </div>
    </div>
  );
}



