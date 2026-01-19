"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

type Exam = {
  id: string;
  patient_name: string;
  exam_type: string;
  report_status?: string;
  internal_notes?: string;
  file_url?: string;
  radiologist_name?: string;
  radiologist_license?: string;
};

export default function ReportManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);
  const examTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      "MRI Brain": "MRI Тархи",
      "MRI Spine": "MRI Нуруу",
      "MRI Knee": "MRI Өвдөг",
      "MRI Abdomen": "MRI Хэвлий",
      "CT Head": "CT Толгой",
      "CT Chest": "CT Цээж",
      "CT Abdomen": "CT Хэвлий",
      "X-Ray": "Рентген",
      "Ultrasound": "Хэт авиан"
    };
    return map[type] || type;
  };
  const reportStatusLabel = (status?: string) => {
    if (!status) return '';
    const normalized = status.toLowerCase();
    if (normalized === 'draft') return 'Ноорог';
    if (normalized === 'final') return 'Эцсийн';
    return status;
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/exams/reports');
        setExams(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        const message = (err as any)?.response?.data?.msg || 'Дүгнэлтийн жагсаалт ачаалж чадсангүй';
        toast.error(message);
        setExams([]);
        setSelected(null);
      }
    };
    fetchReports();
  }, []);

  const updateField = (key: keyof Exam, value: string) => {
    if (!selected) return;
    setSelected({ ...selected, [key]: value });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch('/exams/report', {
        exam_id: selected.id,
        report_status: selected.report_status,
        internal_notes: selected.internal_notes,
        file_url: selected.file_url,
        radiologist_name: selected.radiologist_name,
        radiologist_license: selected.radiologist_license
      });
      toast.success('Дүгнэлт шинэчлэгдлээ');
    } catch (err) {
      console.error(err);
      toast.error('Дүгнэлт шинэчлэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Дүгнэлт удирдлага</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Дууссан шинжилгээ</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {exams.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">Дууссан шинжилгээ алга.</div>
            ) : (
              exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setSelected(exam)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${
                    selected?.id === exam.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{exam.patient_name}</p>
                  <p className="text-xs text-gray-500">{examTypeLabel(exam.exam_type)}</p>
                  <p className="text-xs text-gray-400 mt-1">Төлөв: {reportStatusLabel(exam.report_status || 'Draft')}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{selected.patient_name}</p>
                <p className="text-xs text-gray-500">{examTypeLabel(selected.exam_type)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дүгнэлтийн төлөв</label>
                <select
                  value={selected.report_status || 'Draft'}
                  onChange={(e) => updateField('report_status', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                >
                  <option value="Draft">Ноорог</option>
                  <option value="Final">Эцсийн</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дүгнэлт гаргах эмч</label>
                <input
                  value={selected.radiologist_name || ''}
                  onChange={(e) => updateField('radiologist_name', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                  placeholder="Эмчийн нэр"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Эмчийн лиценз</label>
                <input
                  value={selected.radiologist_license || ''}
                  onChange={(e) => updateField('radiologist_license', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                  placeholder="Лицензийн дугаар"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дүгнэлтийн файл URL</label>
                <input
                  value={selected.file_url || ''}
                  onChange={(e) => updateField('file_url', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дотоод тэмдэглэл</label>
                <textarea
                  value={selected.internal_notes || ''}
                  onChange={(e) => updateField('internal_notes', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border min-h-[100px]"
                  placeholder="Тэмдэглэл"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Хадгалж байна...' : 'Дүгнэлт хадгалах'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Дүгнэлт шинэчлэх шинжилгээг сонгоно уу.</p>
          )}
        </div>
      </div>
    </div>
  );
}


