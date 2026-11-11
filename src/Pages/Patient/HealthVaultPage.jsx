import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import db from '../../services/db';
import {
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineFilter,
} from 'react-icons/hi';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per context.md Section 3.1

const HealthVaultPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('lab_report');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [facility, setFacility] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!user) return;
    return db.subscribe('health_records', (list) => {
      const userRecords = (list || []).filter((r) => r.patientId === user.id);
      setRecords(userRecords);
    });
  }, [user]);

  const handleFileChange = (e) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;

    // Boundary Validation 1: MIME Type Check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, JPEG, and PNG files are accepted.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    // Boundary Validation 2: Max 10MB Check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File size exceeds the 10MB maximum limit.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setUploadError('');

    if (!title.trim()) {
      setUploadError('Please provide a descriptive document title.');
      return;
    }

    // Mock upload URL for demonstration (in production Firebase Storage URL)
    const fileUrl = selectedFile ? URL.createObjectURL(selectedFile) : '#';

    db.add('health_records', {
      patientId: user.id,
      title: title.trim(),
      category,
      date: eventDate,
      doctorName: doctorName.trim() || undefined,
      facility: facility.trim() || undefined,
      fileUrl,
      fileType: selectedFile ? selectedFile.type : 'application/pdf',
      fileSize: selectedFile ? selectedFile.size : 524288,
    });

    // Reset and close
    setTitle('');
    setDoctorName('');
    setFacility('');
    setSelectedFile(null);
    setShowUploadModal(false);
  };

  const handleDeleteRecord = (id) => {
    const confirmed = window.confirm('Are you sure you want to remove this record from your vault?');
    if (confirmed) {
      db.remove('health_records', id);
    }
  };

  const filteredRecords = records.filter(
    (r) => selectedCategory === 'All' || r.category === selectedCategory
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Medical Records</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Store your lab reports, prescriptions, and medical files in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <HiOutlineUpload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'lab_report', 'prescription', 'vaccination', 'scan', 'other'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Document List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
            <HiOutlineFolder className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No Records Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Upload your laboratory tests, previous prescriptions, and medical files to safely share during consultations.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-[#2A9D8F] text-white text-xs font-bold"
          >
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs hover:border-gray-200 transition-all flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#2A9D8F] flex items-center justify-center shrink-0 text-xl">
                  <HiOutlineDocumentText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{rec.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {rec.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Event Date: <span className="font-medium text-gray-700">{rec.date}</span>
                  </p>
                  {(rec.doctorName || rec.facility) && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {rec.doctorName && `Dr: ${rec.doctorName}`} {rec.facility && `• ${rec.facility}`}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {(rec.fileSize / (1024 * 1024)).toFixed(2)} MB • {rec.fileType}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteRecord(rec.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Delete document"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Upload Medical Document</h3>
              <p className="text-xs text-gray-500">
                PDF, PNG, or JPEG files up to 10MB per HealthConnect security policy.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Lipid Profile Test or Chest X-Ray"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#2A9D8F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2A9D8F]"
                  >
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="scan">Radiology Scan</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Date of Record
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Attending Physician
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Name (Optional)"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Hospital / Lab
                  </label>
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    placeholder="Facility name (Optional)"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              {/* Native File Selector with validation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Select File (Max 10MB: PDF, JPG, PNG)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#2A9D8F]/10 file:text-[#2A9D8F] hover:file:bg-[#2A9D8F]/20 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#1E7A6E] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthVaultPage;
