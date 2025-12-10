"use client";

import { useState } from 'react';
import api from '@/lib/api';

type BonusResult = {
  Doctor: string;
  Count: number;
  Bonus: number;
};

export default function BonusCalculator() {
  const [results, setResults] = useState<BonusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculated, setLastCalculated] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/calculate-bonus');
      setResults(response.data);
      setLastCalculated(new Date().toLocaleString());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Урамшуулал бодоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">7 хоногийн урамшуулал тооцох</h1>
      
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Урамшуулал бодох</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Сүүлийн 7 хоногийн өвчтөнүүдийг шүүж эмч тус бүрийн урамшууллыг тооцно. 
              ("Facebook", "Өөрөө" гэсэн эх сурвалжтай өвчтөнүүдийг тооцохгүй)
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
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Сүүлд бодсон: {lastCalculated}</p>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Урамшуулал (₮)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.Doctor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.Count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{result.Bonus.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {results.length === 0 && !loading && lastCalculated && !error && (
         <div className="text-center py-8 text-gray-500">Сүүлийн 7 хоногт урамшуулал тооцох илгээлт олдсонгүй.</div>
      )}
    </div>
  );
}
