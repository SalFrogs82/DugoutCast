import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Film,
  X,
  Sparkles,
  CheckCircle,
  Play,
  ArrowRight,
  Tv,
} from 'lucide-react';
import { GAME_SCENARIOS } from '../data/mockScenarios';
import { GameClipScenario } from '../types/broadcast';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: GameClipScenario) => void;
  onUploadCustomVideo: (file: File, url: string, extractedFrames: string[]) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  onUploadCustomVideo,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewUrl) return;
    setIsExtractingFrames(true);

    try {
      // Extract key video frames via offscreen canvas
      const video = document.createElement('video');
      video.src = previewUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;

      await new Promise((resolve) => {
        video.onloadeddata = () => resolve(true);
      });

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 270;
      const ctx = canvas.getContext('2d');

      const frames: string[] = [];
      const times = [0.5, 1.5, 3.0, 5.0, 7.0, 9.0];

      for (const t of times) {
        if (t < video.duration) {
          video.currentTime = t;
          await new Promise((resolve) => {
            video.onseeked = () => resolve(true);
          });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL('image/jpeg', 0.8));
          }
        }
      }

      setIsExtractingFrames(false);
      onUploadCustomVideo(selectedFile, previewUrl, frames);
      onClose();
    } catch {
      setIsExtractingFrames(false);
      onUploadCustomVideo(selectedFile, previewUrl, []);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Film className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Load Softball Game Footage
              </h3>
              <p className="text-xs text-slate-400">
                Choose a GameChanger tournament archive or upload custom game footage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Curated GameChanger Moments */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>GameChanger Live Stream Archives</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GAME_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    onSelectScenario(sc);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-amber-500/50 hover:bg-slate-950 text-left transition-all group"
                >
                  <div className="aspect-video w-full rounded-lg bg-slate-800 mb-2.5 overflow-hidden relative">
                    <img
                      src={sc.thumbnailUrl}
                      alt={sc.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {sc.situation.inning} · {sc.situation.count} Count
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white font-display line-clamp-1 mb-1 group-hover:text-amber-400 transition-colors">
                    {sc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop File Upload */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Upload Your Own Game Stream (MP4, MOV, WebM)</span>
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-white mb-1">
                {selectedFile ? selectedFile.name : 'Click to browse or drag & drop video'}
              </div>
              <p className="text-[11px] text-slate-400">
                Supports GameChanger downloads, iPhone clips, and tournament livestreams
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xs text-white truncate max-w-xs">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isExtractingFrames}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isExtractingFrames ? 'Extracting Frames...' : 'Analyze Video'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
