"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';

type PatientRecord = {
  Date: string;
  ID: string;
  Name: string;
  Age: number;
  Gender: string;
  Patient_Phone?: string;
  Clinical_Info?: string;
  Scan_Type: string;
  Contrast: string;
  Technician?: string;
  CD_Taken?: string;
  Result_Out?: string;
  Source: string;
  Hospital: string;
  Department: string;
  Doctor: string;
  Doctor_Phone?: string;
  Status: string;
  Notes: string;
};

export default function ViewRecords() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await api.get('/get-records');
        setRecords(response.data);
      } catch (err) {
        setError('Жагсаалт татахад алдаа гарлаа. Серверийг шалгана уу.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) return <div className="p-8 text-center">Уншиж байна...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">Өвчтөний жагсаалт</h1>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Огноо</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Нэр</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Шинжилгээ</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Хариу</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Эх сурвалж</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Эмч</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {records.map((record, index) => (
              <tr key={index}>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.Date}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{record.Name}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.ID}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.Scan_Type}</td>
                {/* Check for "Тийм" in Mongolian context for Result_Out */}
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {(record.Result_Out === 'Yes' || record.Result_Out === 'Тийм') ? '✅' : '⏳'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.Source}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.Doctor}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    record.Status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.Status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
