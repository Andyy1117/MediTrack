"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Calendar, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Exam = {
  id: string;
  patient_name: string;
  national_id: string;
  exam_type: string;
  exam_date?: string;
  status: string;
};

type Doctor = {
  id: number;
  name: string;
  hospital?: string;
  role?: string;
  license_no?: string;
};

export default function TechnicianDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Form State
  const [referringDocId, setReferringDocId] = useState('');
  const [radiologistId, setRadiologistId] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [mriMachineId, setMriMachineId] = useState('');
  const [scanStart, setScanStart] = useState('');
  const [scanEnd, setScanEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
  const statusLabel = (status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'pending') return 'Хүлээгдэж буй';
    if (normalized === 'completed') return 'Дууссан';
    if (normalized === 'cancelled') return 'Цуцалсан';
    if (normalized === 'rescheduled') return 'Дахин товлосон';
    return status || '';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/exams/pending'),
          api.get('/doctors')
        ]);

        const [examsRes, docsRes] = results;

        if (examsRes.status === 'fulfilled') {
          setExams(examsRes.value.data || []);
        } else {
          console.error('Failed to load pending exams', examsRes.reason);
          setExams([]);
        }

        if (docsRes.status === 'fulfilled') {
          setDoctors(docsRes.value.data || []);
        } else {
          console.error('Failed to load doctors', docsRes.reason);
          setDoctors([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Мэдээлэл ачаалж чадсангүй");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleComplete = async () => {
    if (!selectedExam || !referringDocId || !radiologistId) return;

    setSubmitting(true);
    try {
      await api.patch('/exams/complete', {
        exam_id: selectedExam.id,
        referring_doctor_id: referringDocId,
        radiologist_name: reportingRadiologists.find((r) => String(r.id) === String(radiologistId))?.name,
        radiologist_license: reportingRadiologists.find((r) => String(r.id) === String(radiologistId))?.license_no,
        assigned_tech: assignedTech,
        mri_machine_id: mriMachineId,
        scan_start: scanStart ? new Date(scanStart).toISOString() : null,
        scan_end: scanEnd ? new Date(scanEnd).toISOString() : null
      });
      
      // Remove from local list
      setExams(prev => prev.filter(e => e.id !== selectedExam.id));
      setSelectedExam(null);
      setReferringDocId('');
      setRadiologistId('');
      setAssignedTech('');
      setMriMachineId('');
      setScanStart('');
      setScanEnd('');
      toast.success("Шинжилгээг дууссан гэж тэмдэглэлээ!");
    } catch (err) {
      console.error("Error completing exam:", err);
      const message = (err as any)?.response?.data?.msg || "Шинжилгээ дуусгахад алдаа гарлаа";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const referringDoctors = doctors.filter((d) => (d.role || '').toLowerCase() === 'referring');
  const reportingRadiologists = doctors.filter((d) => (d.role || '').toLowerCase() === 'reporting');

  if (loading) return <div className="p-8 text-center text-gray-500">Хүлээгдэж буй шинжилгээ ачаалж байна...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Хүлээгдэж буй шинжилгээний жагсаалт</h1>
      
      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Хүлээгдэж буй шинжилгээ алга.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
            <div 
                key={exam.id} 
                onClick={() => setSelectedExam(exam)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                        <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        {statusLabel(exam.status)}
                    </span>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-1">{exam.patient_name}</h3>
                <p className="text-sm text-gray-500 mb-4">{exam.national_id}</p>
                
                <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                        <Activity className="h-4 w-4 mr-2" />
                        {examTypeLabel(exam.exam_type)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'Огноо байхгүй'}
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <button 
                onClick={() => setSelectedExam(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                <X className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-bold mb-4">Шинжилгээ дуусгах</h2>
            <div className="mb-6 space-y-1">
                <p className="text-sm text-gray-500">Өвчтөн: <span className="font-medium text-gray-900">{selectedExam.patient_name}</span></p>
                <p className="text-sm text-gray-500">Шинжилгээ: <span className="font-medium text-gray-900">{examTypeLabel(selectedExam.exam_type)}</span></p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Илгээгч эмч</label>
                    <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={referringDocId}
                        onChange={(e) => setReferringDocId(e.target.value)}
                    >
                        <option value="">Эмч сонгох...</option>
                        {referringDoctors.map(doc => (
                            <option key={doc.id} value={doc.id}>
                                {doc.name} {doc.hospital ? `(${doc.hospital})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Дүгнэлт гаргах эмч</label>
                    <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={radiologistId}
                        onChange={(e) => setRadiologistId(e.target.value)}
                    >
                        <option value="">Дүгнэлт гаргах эмч сонгох...</option>
                        {reportingRadiologists.map(rad => (
                            <option key={rad.id} value={rad.id}>
                                {rad.name} {rad.hospital ? `(${rad.hospital})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Хариуцсан техникч</label>
                    <input
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={assignedTech}
                        onChange={(e) => setAssignedTech(e.target.value)}
                        placeholder="Техникчийн нэр"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MRI төхөөрөмжийн ID</label>
                    <input
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={mriMachineId}
                        onChange={(e) => setMriMachineId(e.target.value)}
                        placeholder="Төхөөрөмжийн ID"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Шинжилгээ эхлэх</label>
                    <input
                        type="datetime-local"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={scanStart}
                        onChange={(e) => setScanStart(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Шинжилгээ дуусах</label>
                    <input
                        type="datetime-local"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={scanEnd}
                        onChange={(e) => setScanEnd(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleComplete}
                    disabled={submitting || !referringDocId || !radiologistId}
                    className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {submitting ? 'Дуусгаж байна...' : 'Дууссан гэж тэмдэглэх'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
