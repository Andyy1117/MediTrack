"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText } from 'lucide-react';

type AuditLog = {
  user_id: string;
  action: string;
  table: string;
  target_id: string;
  old: string;
  new: string;
  timestamp: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const actionLabel = (action: string) => {
    const normalized = action.toLowerCase();
    if (normalized === 'insert') return 'Нэмсэн';
    if (normalized === 'update') return 'Шинэчилсэн';
    if (normalized === 'delete') return 'Устгасан';
    return action;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Аудитын бүртгэл</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Огноо</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Хэрэглэгч</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Үйлдэл</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Хүснэгт</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Зорилтот ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                  Аудитын бүртгэл ачаалж байна...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                  Аудитын бүртгэл олдсонгүй.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={`${log.timestamp}-${idx}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actionLabel(log.action)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.table}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.target_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



