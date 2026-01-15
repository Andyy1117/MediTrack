"use client";

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { CalendarCheck } from 'lucide-react';

type Exam = {
  id: string;
  patient_name: string;
  exam_type: string;
  exam_date?: string;
  time_slot?: string;
};

export default function ReceptionSchedulePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await api.get('/exams/today');
        setExams(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  const count = useMemo(() => exams.length, [exams]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Today's Schedule</h1>

      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Scheduled Patients</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{loading ? '...' : count}</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-full">
          <CalendarCheck className="h-6 w-6 text-indigo-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">
                  Loading schedule...
                </td>
              </tr>
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">
                  No scheduled patients for today.
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.patient_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.exam_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.time_slot || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


