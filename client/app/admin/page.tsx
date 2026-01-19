"use client";

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Activity, CalendarCheck, ClipboardList, TrendingUp } from 'lucide-react';

type BonusRow = {
  doctor_id: number;
  doctor_name: string;
  hospital: string;
  exam_count: number;
  total_bonus: number;
};

type Exam = {
  id: string;
  exam_date?: string;
};

type RevenueSeriesRow = {
  label: string;
  total: number;
};

export default function AdminDashboard() {
  const [todayExams, setTodayExams] = useState<Exam[]>([]);
  const [pendingExamsCount, setPendingExamsCount] = useState(0);
  const [topReferrers, setTopReferrers] = useState<BonusRow[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<RevenueSeriesRow[]>([]);
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
    const fetchDashboard = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/exams/today'),
          api.get('/exams/pending'),
          api.get('/admin/bonus-report'),
          api.get('/admin/revenue-week')
        ]);

        const [todayRes, pendingRes, bonusRes, revenueRes] = results;

        if (todayRes.status === 'fulfilled') {
          setTodayExams(todayRes.value.data || []);
        } else {
          console.error('Failed to load today exams', todayRes.reason);
          setTodayExams([]);
        }

        if (pendingRes.status === 'fulfilled') {
          setPendingExamsCount((pendingRes.value.data || []).length);
        } else {
          console.error('Failed to load pending exams', pendingRes.reason);
          setPendingExamsCount(0);
        }

        if (bonusRes.status === 'fulfilled') {
          setTopReferrers((bonusRes.value.data?.data || []).slice(0, 5));
        } else {
          console.error('Failed to load bonus report', bonusRes.reason);
          setTopReferrers([]);
        }

        if (revenueRes.status === 'fulfilled') {
          setRevenueSeries(revenueRes.value.data?.series || []);
          setTotalRevenue(revenueRes.value.data?.total_revenue || 0);
        } else {
          console.error('Failed to load revenue report', revenueRes.reason);
          setRevenueSeries([]);
          setTotalRevenue(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const todayCount = useMemo(() => todayExams.length, [todayExams]);
  const revenueMax = Math.max(...revenueSeries.map((r) => r.total), 1);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Админ самбар</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Өнөөдрийн товлогдсон өвчтөн"
          value={loading ? '...' : todayCount}
          icon={<CalendarCheck className="h-6 w-6 text-indigo-600" />}
        />
        <DashboardCard
          title="Хүлээгдэж буй дүгнэлт"
          value={loading ? '...' : pendingExamsCount}
          icon={<ClipboardList className="h-6 w-6 text-amber-600" />}
        />
        <DashboardCard
          title="7 хоногийн шилдэг илгээгч"
          value={loading ? '...' : topReferrers.length}
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
        />
        <DashboardCard
          title="7 хоногийн орлого (₮)"
          value={loading ? '...' : totalRevenue}
          icon={<Activity className="h-6 w-6 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">7 хоногийн орлого (Админ)</h2>
          <div className="space-y-3">
          {revenueSeries.map((row) => (
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
          {revenueSeries.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">Одоогоор орлогын мэдээлэл алга.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Шилдэг илгээгч эмч нар</h2>
          {topReferrers.length === 0 ? (
            <p className="text-sm text-gray-500">Илгээлтийн мэдээлэл алга.</p>
          ) : (
            <ul className="space-y-3">
              {topReferrers.map((doc) => (
                <li key={doc.doctor_id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.doctor_name}</p>
                    <p className="text-xs text-gray-500">{doc.hospital}</p>
                  </div>
                  <span className="text-sm text-gray-600">{doc.exam_count} шинжилгээ</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
    </div>
  );
}
