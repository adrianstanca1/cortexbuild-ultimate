import { useState, useRef } from 'react';
import { Mic, Camera, Send, CloudOff } from 'lucide-react';
import { toast } from 'sonner';
import { offlineFetch } from '../../services/offlineFetch';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface ReportForm {
  workers: string;
  progress: string;
  notes: string;
  weather: string;
}

export default function MobileDailyReport() {
  const { isOnline } = useNetworkStatus();
  const [form, setForm]      = useState<ReportForm>({ workers: '', progress: '', notes: '', weather: '' });
  const [recording, setRec]  = useState(false);
  const [photos, setPhotos]  = useState<File[]>([]);
  const [submitting, setSub] = useState(false);
  const fileRef              = useRef<HTMLInputElement>(null);

  const set = (field: keyof ReportForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(p => [...p, ...Array.from(e.target.files!)].slice(0, 5));
  };

  const handleVoice = async () => {
    if (!('MediaRecorder' in window)) { toast.info('Voice input not supported on this device'); return; }
    setRec(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('cortexbuild_token') ?? ''}` },
            body: fd,
          });
          if (res.ok) {
            const data = await res.json() as { text?: string; structured?: { workers?: number; progress?: number } };
            if (data.structured?.workers)  setForm(f => ({ ...f, workers: String(data.structured!.workers) }));
            if (data.structured?.progress) setForm(f => ({ ...f, progress: String(data.structured!.progress) }));
            if (data.text)                 setForm(f => ({ ...f, notes: (f.notes + ' ' + data.text!).trim() }));
            toast.success('Voice transcribed');
          }
        } catch { toast.info('Transcription unavailable'); }
        setRec(false);
      };
      rec.start();
      setTimeout(() => rec.stop(), 30000);
    } catch { toast.error('Microphone access denied'); setRec(false); }
  };

  const handleSubmit = async () => {
    if (!form.notes && !form.workers) { toast.error('Add workers count or notes'); return; }
    setSub(true);
    try {
      const result = await offlineFetch('/api/daily-reports', {
        method: 'POST',
        body: JSON.stringify({
          workers_count: Number(form.workers) || 0,
          progress_percentage: Number(form.progress) || 0,
          notes: form.notes,
          weather: form.weather,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if ((result as { queued?: boolean }).queued) {
        toast.success('Saved — will sync when online', { icon: <CloudOff size={14} /> });
      } else {
        toast.success('Report submitted');
      }
      setForm({ workers: '', progress: '', notes: '', weather: '' });
      setPhotos([]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-slate-100">Daily Report</h2>

      <button
        onPointerDown={handleVoice}
        disabled={recording}
        className={`w-full rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 ${
          recording ? 'bg-blue-700 animate-pulse' : 'bg-slate-800 border border-slate-700'
        }`}
      >
        <Mic size={28} className={recording ? 'text-white' : 'text-blue-400'} />
        <span className="text-sm font-medium text-slate-200">
          {recording ? 'Recording… release to stop' : 'Hold to dictate'}
        </span>
        <span className="text-xs text-slate-400">AI fills the form for you</span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs mb-1 block">Workers on site</label>
          <input value={form.workers} onChange={set('workers')} type="number" inputMode="numeric"
            placeholder="12" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm" />
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1 block">Progress %</label>
          <input value={form.progress} onChange={set('progress')} type="number" inputMode="numeric"
            placeholder="76" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm" />
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-xs mb-1 block">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="What happened today…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm resize-none" />
      </div>

      <div>
        <label className="text-slate-400 text-xs mb-2 block">Photos ({photos.length}/5)</label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((f, i) => (
            <img key={i} src={URL.createObjectURL(f)} alt=""
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          ))}
          {photos.length < 5 && (
            <button onClick={() => fileRef.current?.click()}
              className="w-16 h-16 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Camera size={20} className="text-slate-500" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple
          className="hidden" onChange={handlePhoto} />
      </div>

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-2xl py-3.5 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
        <Send size={16} />
        {submitting ? 'Saving…' : isOnline ? 'Submit Report' : 'Save for Sync'}
      </button>
    </div>
  );
}
