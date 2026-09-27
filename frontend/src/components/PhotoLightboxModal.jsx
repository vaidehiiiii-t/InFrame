import React, { useEffect } from 'react';
import { X, Download, Trash2, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import { getPhotoUrl } from '../api/events';

export const PhotoLightboxModal = ({
  photo,
  onClose,
  onDelete,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  isHost,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!photo) return null;

  const fullUrl = getPhotoUrl(photo.file_url);
  const canDelete = photo.is_uploader || isHost;

  const handleDownload = async () => {
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.file_name || 'event-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl w-full h-full max-h-[92vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 rounded-full border border-white/10 text-white backdrop-blur-sm mb-4">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold truncate text-white">{photo.file_name}</h4>
              <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400">
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3 text-neutral-400" />
                  {photo.uploader_name || 'Attendee'}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  {new Date(photo.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              title="Download Original Photo"
              className="btn-icon-circle-inverse w-9 h-9"
            >
              <Download className="w-4 h-4 text-white" />
            </button>

            {canDelete && (
              <button
                onClick={() => onDelete(photo.id)}
                title="Delete Photo"
                className="w-9 h-9 rounded-full bg-red-600/30 hover:bg-red-600/50 text-red-300 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              title="Close Preview (Esc)"
              className="btn-icon-circle-inverse w-9 h-9 ml-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Center Image Container */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <img
            src={fullUrl}
            alt={photo.file_name}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
          />

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={onPrev}
              title="Previous Photo"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={onNext}
              title="Next Photo"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Bar Info */}
        <div className="mt-3 text-center">
          <span className="caption-mono text-neutral-400 bg-black/50 px-3 py-1 rounded-full border border-white/10">
            {(photo.file_size / (1024 * 1024)).toFixed(2)} MB • {photo.content_type}
          </span>
        </div>
      </div>
    </div>
  );
};
