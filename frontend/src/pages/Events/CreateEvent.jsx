import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import eventApi from '../../services/eventApi'; 
import api from '../../services/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'conference', 'workshop', 'concert', 'sports',
  'networking', 'webinar', 'festival', 'other'
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    totalSeats: 100,
    ticketPrice: 0,
    category: 'other',
    imageUrl: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
      toast.success('Image uploaded successfully', { className: 'bg-forest-50 border-2 border-forest-200 !shadow-paper text-forest-900 font-sans font-bold text-xs' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed', { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (new Date(form.date) < new Date()) {
      return toast.error("Historical archives cannot be created. Choose a future date.", { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' });
    }

    setLoading(true);
    try {
      const isoDate = new Date(form.date).toISOString();
      const { data } = await eventApi.create({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        date: isoDate,
        totalSeats: Number(form.totalSeats),
        ticketPrice: Number(form.ticketPrice),
        imageUrl: form.imageUrl.trim() || undefined
      });
      
      toast.success('Registry Entry Created — Pending Curator Approval.', { className: 'bg-forest-50 border-2 border-forest-200 !shadow-paper text-forest-900 font-sans font-bold text-xs' });
      navigate('/dashboard/organizer');
    } catch (err) {
      const msg = err.response?.data?.message || 'Archive submission failed.';
      toast.error(msg, { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper py-16 px-6 lg:px-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* ── HEADER ── */}
        <div className="mb-12 border-b-2 border-forest-700 pb-6">
          <Link to="/dashboard/organizer" className="text-[10px] font-black uppercase tracking-[0.4em] text-ink-400 hover:text-forest-700 transition-colors inline-block mb-4">
            ← Return to Registry Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-5xl border-l-4 border-forest-700 pl-4 font-serif italic font-bold text-ink-900">New Archive Entry</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 bg-paper-200 px-3 py-1.5 border border-paper-300">
              State: <span className="text-forest-700">Pending Verification</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* ── FORM COLUMN ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            <div className="space-y-6 bg-paper border-2 border-forest-700/20 p-8 shadow-paper relative">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-forest-700/20" />
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Event Title</label>
                <input name="title" value={form.title} onChange={handleChange} required maxLength={100}
                  placeholder="e.g., The Midnight Gallery"
                  className="input-paper-box text-lg font-serif italic text-ink-900 placeholder:text-ink-300" />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Narrative / Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} required rows={4}
                  className="input-paper-box min-h-[120px] resize-y" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Temporal (Date)</label>
                  <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required
                    className="input-paper-box [color-scheme:light]" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Category</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="input-paper-box uppercase text-[10px] font-black tracking-widest cursor-pointer bg-white">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Spatial (Location)</label>
                <input name="location" value={form.location} onChange={handleChange} required
                  className="input-paper-box" />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-paper-300">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Capacity</label>
                  <input type="number" name="totalSeats" min={1} value={form.totalSeats} onChange={handleChange}
                    className="input-paper-box text-center font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Admission (₹)</label>
                  <input type="number" name="ticketPrice" min={0} step="0.01" value={form.ticketPrice} onChange={handleChange}
                    className="input-paper-box text-center font-mono font-bold" />
                </div>
              </div>

              <div className="pt-4">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-4">Visual Composition</label>
                
                <div className="flex gap-4 mb-4">
                  <button type="button" onClick={() => setImageMode('url')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 ${imageMode === 'url' ? 'border-forest-700 text-forest-700' : 'border-transparent text-ink-400 hover:text-ink-700 transition-colors'}`}>URL Hash</button>
                  <button type="button" onClick={() => setImageMode('upload')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 ${imageMode === 'upload' ? 'border-forest-700 text-forest-700' : 'border-transparent text-ink-400 hover:text-ink-700 transition-colors'}`}>Local Upload</button>
                </div>

                {imageMode === 'url' ? (
                  <input type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange} 
                    placeholder="https://images.unsplash.com/..."
                    className="input-paper-box text-[10px] text-ink-500 font-mono" />
                ) : (
                  <input type="file" accept="image/*" onChange={handleImageUpload} 
                    className="block w-full text-[10px] text-ink-500 font-mono file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-paper-200 file:text-ink-700 hover:file:bg-paper-300 cursor-pointer" />
                )}
                {uploading && <p className="text-[10px] text-forest-600 mt-2 font-black tracking-widest uppercase">Uploading chunk...</p>}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-forest w-full py-6 text-[11px] shadow-paper">
              {loading ? 'Committing to Archive...' : 'Submit Entry to Registry'}
            </button>
          </form>

          {/* ── PREVIEW COLUMN ── */}
          <div className="lg:col-span-5 relative">
            <div className="lg:sticky lg:top-28">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-400 block mb-4 text-center">Document Preview</label>
              
              <div className="paper-card border-2 border-paper-300 pointer-events-none">
                <div className="aspect-[4/5] bg-paper-200 border-b-2 border-paper-300 overflow-hidden relative">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="Preview" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                         style={{ backgroundImage: `linear-gradient(#1A1A12 1px, transparent 1px), linear-gradient(90deg, #1A1A12 1px, transparent 1px)`, backgroundSize: '10px 10px' }} />
                  )}
                  
                  {!form.imageUrl && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[10px] uppercase tracking-[0.2em] text-ink-300 font-black">
                      <span className="text-3xl mb-2 opacity-40">🖼️</span>
                      Pending Visual
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <span className="bg-paper border-2 border-forest-700 text-forest-700 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] shadow-sm">
                      {form.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-serif italic font-bold text-ink-900 text-2xl mb-3 truncate leading-snug">
                    {form.title || 'Untitled Archive'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-forest-700" />
                    <p className="text-[9px] text-ink-500 uppercase tracking-widest font-black truncate">
                      {form.location || 'Location Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;