'use client';

import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${alt.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-4 bg-black/50 backdrop-blur-md rounded-lg p-3">
          <h3 className="text-white font-semibold text-lg">{alt}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm px-3">{Math.round(zoom * 100)}%</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div
          className="flex-1 flex items-center justify-center overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-white/70 text-sm">
            Click outside or press ESC to close • Use zoom buttons to adjust size
          </p>
        </div>
      </div>
    </div>
  );
}
