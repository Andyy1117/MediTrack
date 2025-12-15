"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function TechnicianDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await api.get('/general/get-records');
        setRecords(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) return <div className="p-8 text-center">Уншиж байна...</div>;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">Техникчийн самбар</h1>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Огноо</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Нэр</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Регистр</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Төрөл</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Төлөв</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {records.map((record, index) => (
              <tr key={index}>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record['Date of Scan'] || record['Date'] || ''}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{record['Full Name'] || record['Name'] || ''}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record['National ID'] || record['ID'] || ''}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record['Scan Type'] || ''}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record['Result Status'] || record['Status'] || ''}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <Link 
                    href={`/technician/update-record?id=${record['National ID'] || record['ID']}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Засах
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

