"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Calendar, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Exam = {
  ID: string;
  Patient_Name: string;
  National_ID: string;
  Exam_Type: string;
  Date_Registered: string;
  Status: string;
};

type Doctor = {
  Doctor_ID: string;
  Name: string;
  Role: string; // 'Referring' or 'Reporting'
  Hospital: string;
  Department: string;
};

export default function TechnicianDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Form State
  const [referringDocId, setReferringDocId] = useState('');
  const [reportingRadId, setReportingRadId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, docsRes] = await Promise.all([
          api.get('/exams/pending'),
          api.get('/doctors')
        ]);
        setExams(examsRes.data);
        setDoctors(docsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleComplete = async () => {
    if (!selectedExam || !referringDocId || !reportingRadId) return;

    setSubmitting(true);
    try {
      await api.patch('/exams/complete', {
        exam_id: selectedExam.ID,
        referring_doctor_id: referringDocId,
        reporting_radiologist_id: reportingRadId
      });
      
      // Remove from local list
      setExams(prev => prev.filter(e => e.ID !== selectedExam.ID));
      setSelectedExam(null);
      setReferringDocId('');
      setReportingRadId('');
      toast.success("Exam marked as completed!");
    } catch (err) {
      console.error("Error completing exam:", err);
      toast.error("Failed to complete exam");
    } finally {
      setSubmitting(false);
    }
  };

  const referringDoctors = doctors.filter(d => d.Role === 'Referring' || !d.Role); // Fallback if Role missing
  const reportingRadiologists = doctors.filter(d => d.Role === 'Reporting');

  if (loading) return <div className="p-8 text-center text-gray-500">Loading pending exams...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Pending Exams Queue</h1>
      
      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No pending exams found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
            <div 
                key={exam.ID} 
                onClick={() => setSelectedExam(exam)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                        <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        {exam.Status}
                    </span>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-1">{exam.Patient_Name}</h3>
                <p className="text-sm text-gray-500 mb-4">{exam.National_ID}</p>
                
                <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                        <Activity className="h-4 w-4 mr-2" />
                        {exam.Exam_Type}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(exam.Date_Registered).toLocaleDateString()}
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

            <h2 className="text-xl font-bold mb-4">Complete Exam</h2>
            <div className="mb-6 space-y-1">
                <p className="text-sm text-gray-500">Patient: <span className="font-medium text-gray-900">{selectedExam.Patient_Name}</span></p>
                <p className="text-sm text-gray-500">Exam: <span className="font-medium text-gray-900">{selectedExam.Exam_Type}</span></p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referring Doctor</label>
                    <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={referringDocId}
                        onChange={(e) => setReferringDocId(e.target.value)}
                    >
                        <option value="">Select Doctor...</option>
                        {referringDoctors.map(doc => (
                            <option key={doc.Doctor_ID} value={doc.Doctor_ID}>
                                {doc.Name} ({doc.Hospital})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Radiologist</label>
                    <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={reportingRadId}
                        onChange={(e) => setReportingRadId(e.target.value)}
                    >
                        <option value="">Select Radiologist...</option>
                        {reportingRadiologists.map(rad => (
                            <option key={rad.Doctor_ID} value={rad.Doctor_ID}>
                                {rad.Name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleComplete}
                    disabled={submitting || !referringDocId || !reportingRadId}
                    className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {submitting ? 'Completing...' : 'Mark as Completed'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
