"use client";

import { useState } from 'react';
import api from '@/lib/api';

type BonusResult = {
  Doctor: string;
  Count: number;
  Bonus: number;
  Patients: string[];
  Period?: string;
};

export default function BonusCalculator() {
  const [results, setResults] = useState<BonusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculated, setLastCalculated] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'calculator' | 'history'>('calculator');

  const fetchHistory = async () => {
    try {
        const res = await api.get('/admin/bonus-history');
        setHistory(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedDate 
        ? `/admin/calculate-bonus?date=${selectedDate}` 
        : '/admin/calculate-bonus';
        
      const response = await api.get(url);
      setResults(response.data);
      setLastCalculated(new Date().toLocaleString());
      fetchHistory(); // Refresh history after calculation
    } catch (err: any) {
      setError(err.response?.data?.error || 'Урамшуулал бодоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">7 хоногийн урамшуулал тооцох</h1>
      
      <div className="flex space-x-4 mb-6">
        <button 
            onClick={() => setViewMode('calculator')}
            className={`px-4 py-2 rounded-md ${viewMode === 'calculator' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
            Тооцоолох
        </button>
        <button 
            onClick={() => { setViewMode('history'); fetchHistory(); }}
            className={`px-4 py-2 rounded-md ${viewMode === 'history' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
            Түүх харах
        </button>
      </div>

      {viewMode === 'calculator' ? (
      <>
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Урамшуулал бодох</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Сүүлийн 7 хоногийн өвчтөнүүдийг шүүж эмч тус бүрийн урамшууллыг тооцно. 
              ("Facebook", "Өөрөө" гэсэн эх сурвалжтай өвчтөнүүдийг тооцохгүй)
            </p>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Огноо сонгох (Сонгохгүй бол өнөөдрөөр)</label>
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block w-full md:w-1/3 rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 sm:text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
                Тухайн сонгосон өдрөөс өмнөх Баасан гараг хүртэлх 7 хоногийг тооцно.
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Тооцоолж байна...' : 'Урамшуулал тооцох'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Алдаа</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Урамшууллын нэгтгэл</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {results[0]?.Period ? `Хугацаа: ${results[0].Period}` : `Сүүлд бодсон: ${lastCalculated}`}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Нийт дүн: <span className="font-bold text-gray-900">{results.reduce((sum, item) => sum + item.Bonus, 0).toLocaleString()} ₮</span>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Эмчийн нэр</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Илгээсэн тоо</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Өвчтөнүүд</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Урамшуулал (₮)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.Doctor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.Count}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs break-words">
                        {result.Patients && result.Patients.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{result.Bonus.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {results.length === 0 && !loading && lastCalculated && !error && (
         <div className="text-center py-8 text-gray-500">Энэ хугацаанд урамшуулал тооцох илгээлт олдсонгүй.</div>
      )}
      </>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Урамшууллын түүх (Weekly_Bonuses Sheet)</h3>
            </div>
            <div className="border-t border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Огноо</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Эмч</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тоо</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дүн</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Өвчтөнүүд</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Хугацаа</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((row, i) => (
                            <tr key={i}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Date || row['Calculated Date'] || Object.values(row)[0]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Doctor || Object.values(row)[1]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Count || Object.values(row)[2]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Bonus || Object.values(row)[3]}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={row.Patients || Object.values(row)[4]}>
                                    {row.Patients || Object.values(row)[4]}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Period || Object.values(row)[5]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
}
