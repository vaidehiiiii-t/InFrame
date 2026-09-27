import React, { useState } from 'react';
import { 
  Camera, 
  Maximize2, 
  Download, 
  Trash2, 
  ArrowUpDown, 
  User, 
  Clock, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { getPhotoUrl } from '../api/events';
import { PhotoLightboxModal } from './PhotoLightboxModal';

export const PhotoGallery = ({ 
  photos, 
  isLoading, 
  onDeletePhoto, 
  onOpenUpload,
  isHost 
}) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'mine'

  // Filter photos
  const filteredPhotos = photos.filter((p) => {
    if (filterMode === 'mine') return p.is_uploader;
    return true;
  });

  // Sort photos
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    const timeA = new Date(a.uploaded_at).getTime();
    const timeB = new Date(b.uploaded_at).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const activePhoto = lightboxIndex !== null ? sortedPhotos[lightboxIndex] : null;

  const handleNext = () => {
    if (lightboxIndex !== null && lightboxIndex < sortedPhotos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleQuickDownload = async (photo, e) => {
    e.stopPropagation();
    const fullUrl = getPhotoUrl(photo.file_url);
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

  const handleDelete = (photoId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this photo from the event?')) {
      onDeletePhoto(photoId);
      if (lightboxIndex !== null) setLightboxIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gallery Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-4">
        {/* Figma Pill Toggle Tabs for Gallery Scope */}
        <div className="inline-flex p-1 bg-[#f5f5f7] border border-[#e5e5e5] rounded-full self-start">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            All Photos ({photos.length})
          </button>
          <button
            onClick={() => setFilterMode('mine')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterMode === 'mine'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            My Uploads ({photos.filter((p) => p.is_uploader).length})
          </button>
        </div>

        {/* Sorting and Actions */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="btn-secondary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 font-mono"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <span>{sortOrder === 'newest' ? 'NEWEST FIRST' : 'OLDEST FIRST'}</span>
          </button>

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload Photos</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="caption-mono text-neutral-500">Loading gallery photos...</p>
        </div>
      ) : sortedPhotos.length === 0 ? (
        /* Empty State */
        <div className="block-cream rounded-3xl p-10 sm:p-14 text-center border border-black/10">
          <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-black mb-4 shadow-sm">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-black tracking-tight">
            {filterMode === 'mine' ? "You haven't uploaded any photos yet" : 'No event photos yet'}
          </h3>
          <p className="caption-mono text-neutral-600 max-w-sm mx-auto mt-1">
            {filterMode === 'mine' 
              ? 'Upload your pictures to share them with other attendees.'
              : 'Be the first to upload photos from the event. All members will be able to view them.'}
          </p>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="mt-6 btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Upload First Photo</span>
            </button>
          )}
        </div>
      ) : (
        /* Responsive Photo Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sortedPhotos.map((photo, index) => {
            const canDelete = photo.is_uploader || isHost;
            const fullUrl = getPhotoUrl(photo.file_url);

            return (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative bg-[#f5f5f7] border border-[#e5e5e5] hover:border-black rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Image Frame */}
                <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-200 relative">
                  <img
                    src={fullUrl}
                    alt={photo.file_name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Hover Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(index);
                      }}
                      title="Expand View"
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleQuickDownload(photo, e)}
                      title="Download Photo"
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(photo.id, e)}
                        title="Delete Photo"
                        className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Metadata Footer */}
                <div className="p-3 bg-white flex items-center justify-between border-t border-[#f0f0f0] text-[11px]">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-black truncate">{photo.file_name}</p>
                    <p className="caption-mono text-[9px] text-neutral-500 truncate mt-0.5">
                      {photo.uploader_name || 'Attendee'} • {new Date(photo.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  {photo.is_uploader && (
                    <span className="caption-mono text-[8px] px-2 py-0.5 rounded-full bg-[#D2F46E] text-black font-semibold flex-shrink-0">
                      YOU
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <PhotoLightboxModal
          photo={activePhoto}
          onClose={() => setLightboxIndex(null)}
          onDelete={(id) => {
            onDeletePhoto(id);
            setLightboxIndex(null);
          }}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={lightboxIndex < sortedPhotos.length - 1}
          hasPrev={lightboxIndex > 0}
          isHost={isHost}
        />
      )}
    </div>
  );
};
