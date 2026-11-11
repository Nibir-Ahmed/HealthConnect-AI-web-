import React, { useRef } from 'react';

const FileUploader = ({ onFileSelect, accept = '.pdf,.jpg,.png,.jpeg' }) => {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect?.(file);
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div className="text-gray-400 text-sm mb-1 font-medium">Click to upload file</div>
      <p className="text-xs text-gray-400">PDF, PNG, or JPG up to 10MB</p>
    </div>
  );
};

export default FileUploader;
