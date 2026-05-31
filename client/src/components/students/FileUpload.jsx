import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, File, X, CheckCircle, AlertCircle } from 'lucide-react';

function FileUpload({ onFileSelect, accept = '.xlsx,.csv,.pdf', maxSize = 10 * 1024 * 1024 }) {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload .xlsx, .csv, or .pdf files.');
      } else {
        setError(rejection.errors[0]?.message || 'Invalid file');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setUploadProgress(0);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setUploadProgress(Math.min(Math.round(progress), 100));
      }, 200);

      onFileSelect?.(selectedFile);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    maxSize,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setError('');
    onFileSelect?.(null);
  };

  const getFileIcon = (fileName) => {
    if (fileName?.endsWith('.xlsx') || fileName?.endsWith('.csv')) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    }
    return <File className="w-8 h-8 text-primary-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20 scale-[1.02]'
              : isDragReject
              ? 'border-red-400 bg-red-50/50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragActive
                ? 'bg-primary-100 dark:bg-primary-900/40 scale-110'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Upload className={`w-8 h-8 transition-colors ${
                isDragActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or <span className="text-primary-600 dark:text-primary-400 font-medium">click to browse</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">.xlsx</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">.csv</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">.pdf</span>
              <span>Max 10MB</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            {getFileIcon(file.name)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
              {/* Progress bar */}
              <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{uploadProgress}%</span>
                {uploadProgress === 100 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
