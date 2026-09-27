import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { eventsApi } from '../api/events';

export const PhotoUploadZone = ({ eventId, onPhotosUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [generalError, setGeneralError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  const handleFiles = async (files) => {
    setGeneralError('');
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles = [];
    const invalidFiles = [];

    fileList.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        invalidFiles.push(`${file.name}: unsupported format`);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name}: exceeds 15MB`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          status: 'pending', // 'pending' | 'uploading' | 'success' | 'duplicate' | 'error'
          progress: 0,
          errorMessage: '',
        });
      }
    });

    if (invalidFiles.length > 0) {
      setGeneralError(invalidFiles.join(' • '));
    }

    if (validFiles.length === 0) return;

    setUploadQueue((prev) => [...validFiles, ...prev]);
    setIsUploading(true);

    let uploadedCount = 0;

    for (const item of validFiles) {
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
      );

      try {
        const res = await eventsApi.uploadPhoto(eventId, item.file, (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || item.size)
          );
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: percentCompleted } : q))
          );
        });

        const isDuplicate = res.is_duplicate;
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: isDuplicate ? 'duplicate' : 'success',
                  progress: 100,
                  errorMessage: isDuplicate ? 'Duplicate photo already in gallery' : '',
                }
              : q
          )
        );
        uploadedCount++;
      } catch (err) {
        const msg = err.response?.data?.detail || 'Failed to upload photo.';
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: msg }
              : q
          )
        );
      }
    }

    setIsUploading(false);
    if (uploadedCount > 0 && onPhotosUploaded) {
      onPhotosUploaded();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const clearQueue = () => {
    setUploadQueue([]);
    setGeneralError('');
  };

  return (
    <div className="card-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4">
        <div>
          <span className="eyebrow-mono block">Milestone 2 Active</span>
          <h3 className="text-xl font-bold tracking-tight text-black">Upload Event Photos</h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Share event photos with attendees. Standard JPEG, PNG, and WebP formats supported (up to 15MB each).
          </p>
        </div>
        {uploadQueue.length > 0 && (
          <button
            onClick={clearQueue}
            className="caption-mono text-neutral-500 hover:text-black hover:underline self-start sm:self-auto"
          >
            Clear Upload Log
          </button>
        )}
      </div>

      {generalError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Drag and Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-black bg-[#f5f5f7] scale-[0.99]'
            : 'border-[#d4d4d8] hover:border-black bg-[#fafafa] hover:bg-[#f5f5f7]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-black mb-4 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h4 className="text-base font-bold text-black tracking-tight mb-1">
          {isDragging ? 'Release photos to upload' : 'Click to select or drag and drop photos'}
        </h4>
        <p className="caption-mono text-neutral-500 max-w-sm mx-auto">
          High-resolution photos will be indexed instantly into the event gallery
        </p>

        <div className="mt-5">
          <button
            type="button"
            className="btn-primary text-xs py-2 px-5 pointer-events-none"
          >
            Browse From Device
          </button>
        </div>
      </div>

      {/* Active Upload Queue Display */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-neutral-600 font-mono">
            <span>QUEUE STATUS ({uploadQueue.filter((q) => q.status === 'success').length}/{uploadQueue.length} COMPLETED)</span>
            {isUploading && (
              <span className="flex items-center gap-1.5 text-black font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-[#e5e5e5] bg-white flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#f5f5f7] border border-[#e5e5e5] flex items-center justify-center text-neutral-600 flex-shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-black truncate max-w-[200px] sm:max-w-xs">{item.name}</p>
                    <p className="caption-mono text-[10px] text-neutral-500">
                      {(item.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-neutral-600">{item.progress}%</span>
                      <div className="w-16 h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.status === 'success' && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-mono text-[11px] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Uploaded
                    </span>
                  )}

                  {item.status === 'duplicate' && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-mono text-[11px] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Duplicate (Verified)
                    </span>
                  )}

                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-mono text-[11px] font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      {item.errorMessage || 'Failed'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
