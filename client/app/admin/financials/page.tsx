"use client";

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { DollarSign, TrendingUp } from 'lucide-react';

type BonusRow = {
  doctor_id: number;
  doctor_name: string;
  hospital: string;
  exam_count: number;
  total_bonus: number;
};

type RevenueRow = {
  label: string;
  total: number;
};

export default function FinancialReportsPage() {
  const [bonusRows, setBonusRows] = useState<BonusRow[]>([]);
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const dayLabel = (label: string) => {
    const map: Record<string, string> = {
      Mon: 'Да',
      Tue: 'Мя',
      Wed: 'Лх',
      Thu: 'Пү',
      Fri: 'Ба',
      Sat: 'Бя',
      Sun: 'Ня'
    };
    return map[label] || label;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/admin/bonus-report'),
          api.get('/admin/revenue-week')
        ]);

        const [bonusRes, revenueRes] = results;

        if (bonusRes.status === 'fulfilled') {
          setBonusRows(bonusRes.value.data?.data || []);
        } else {
          console.error('Failed to load bonus report', bonusRes.reason);
          setBonusRows([]);
        }

        if (revenueRes.status === 'fulfilled') {
          setRevenueRows(revenueRes.value.data?.series || []);
          setTotalRevenue(revenueRes.value.data?.total_revenue || 0);
        } else {
          console.error('Failed to load revenue report', revenueRes.reason);
          setRevenueRows([]);
          setTotalRevenue(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalExams = useMemo(() => bonusRows.reduce((sum, r) => sum + r.exam_count, 0), [bonusRows]);
  const totalBonus = useMemo(() => bonusRows.reduce((sum, r) => sum + r.total_bonus, 0), [bonusRows]);
  const revenueMax = Math.max(...revenueRows.map((r) => r.total), 1);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Санхүүгийн тайлан</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">7 хоногийн дууссан шинжилгээ</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{loading ? '...' : totalExams}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-full">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Нийт урамшуулал (₮)</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{loading ? '...' : totalBonus}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full">
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">7 хоногийн орлого (₮)</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{loading ? '...' : totalRevenue}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-full">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">7 хоногийн орлого</h2>
          {revenueRows.length === 0 ? (
            <p className="text-sm text-gray-500">Орлогын мэдээлэл алга.</p>
          ) : (
            <div className="space-y-3">
              {revenueRows.map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="w-10 text-sm text-gray-500">{dayLabel(row.label)}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-indigo-500 rounded-full"
                      style={{ width: `${(row.total / revenueMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-500 text-right">{row.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Шилдэг илгээгч (7 хоног)</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Урамшууллын тайлан ачаалж байна...</p>
          ) : bonusRows.length === 0 ? (
            <p className="text-sm text-gray-500">Урамшууллын мэдээлэл алга.</p>
          ) : (
            <div className="space-y-4">
              {bonusRows.map((row) => (
                <div key={row.doctor_id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{row.doctor_name}</p>
                    <p className="text-xs text-gray-500">{row.hospital}</p>
                  </div>
                  <div className="text-sm text-gray-600">{row.exam_count} шинжилгээ</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


