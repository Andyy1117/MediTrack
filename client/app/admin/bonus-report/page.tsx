"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Download } from 'lucide-react';

type BonusData = {
  doctor_id: string;
  doctor_name: string;
  hospital: string;
  exam_count: number;
  total_bonus: number;
};

type ReportResponse = {
  period: string;
  data: BonusData[];
};

export default function BonusReport() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/admin/bonus-report');
        setReport(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Generating report...</div>;
  if (!report) return <div className="p-8 text-center text-red-500">Failed to load report.</div>;

  const totalExams = report.data.reduce((sum, item) => sum + item.exam_count, 0);
  const totalBonus = report.data.reduce((sum, item) => sum + item.total_bonus, 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Bonus Report</h1>
            <p className="text-gray-500 mt-1">Period: {report.period}</p>
        </div>
        <button 
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            onClick={() => window.print()}
        >
            <Download className="mr-2 h-4 w-4" />
            Print / PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Total Exams (Completed)</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalExams}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500">Total Bonus Payout</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalBonus.toLocaleString()} ₮</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Exams</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus (50k/exam)</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {report.data.map((row) => (
                <tr key={row.doctor_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.doctor_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.hospital}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.exam_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {row.total_bonus.toLocaleString()} ₮
                </td>
                </tr>
            ))}
            {report.data.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No completed exams found for this week.</td>
                </tr>
            )}
            </tbody>
        </table>
      </div>
    </div>
  );
}


