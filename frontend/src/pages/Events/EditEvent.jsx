import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'conference', 'workshop', 'concert', 'sports',
  'networking', 'webinar', 'festival', 'other'
];

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [editRequestStatus, setEditRequestStatus] = useState('none');
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

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        const ev = data.data;
        setStatus(ev.status);
        setEditRequestStatus(ev.editRequestStatus || 'none');
        setForm({
          title: ev.title || '',
          description: ev.description || '',
          date: toLocalInput(ev.date),
          location: ev.location || '',
          totalSeats: ev.totalSeats,
          ticketPrice: ev.ticketPrice,
          category: ev.category || 'other',
          imageUrl: ev.imageUrl || ''
        });
      } catch {
        toast.error('Could not load event', { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' });
        navigate('/dashboard/organizer');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

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

  const isLocked = !isAdmin && status === 'approved' && editRequestStatus !== 'approved';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('Approved events cannot be edited by organizers without an approved request.', { className: 'bg-amber-50 border-2 border-amber-200 !shadow-paper text-amber-900 font-sans font-bold text-xs' });
      return;
    }
    setSaving(true);
    try {
      const isoDate = new Date(form.date).toISOString();
      await api.put(`/events/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        date: isoDate,
        location: form.location.trim(),
        totalSeats: Number(form.totalSeats),
        ticketPrice: Number(form.ticketPrice),
        category: form.category,
        imageUrl: form.imageUrl.trim() || ''
      });
      toast.success('Event updated — resubmitted as pending', { className: 'bg-forest-50 border-2 border-forest-200 !shadow-paper text-forest-900 font-sans font-bold text-xs' });
      navigate('/dashboard/organizer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed', { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-paper-300 border-t-forest-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-wrapper py-16 px-6 lg:px-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 border-b-2 border-forest-700 pb-6">
          <Link to="/dashboard/organizer" className="text-[10px] font-black uppercase tracking-[0.4em] text-ink-400 hover:text-forest-700 transition-colors inline-block mb-4">
            ← Return to Registry Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <h1 className="text-5xl border-l-4 border-amber-600 pl-4 font-serif italic font-bold text-ink-900">Amend Archive Entry</h1>
             <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 bg-paper-200 px-3 py-1.5 border border-paper-300">
               State: <span className="text-amber-700">{status}</span>
             </p>
          </div>
        </div>

        {isLocked && (
          <div className="bg-amber-50 border-2 border-amber-300 p-6 shadow-paper mb-12 flex items-center gap-4 text-amber-900">
            <span className="text-2xl">⚠️</span>
            <p className="font-sans font-bold text-sm">
              This entry is <span className="uppercase tracking-widest text-[10px]">Approved</span>. Organizers cannot amend an active public registry listing via the API rules. Contact an administrator to issue an override.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-paper border-2 border-amber-600/20 p-8 shadow-paper relative space-y-8">
          <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-amber-600/20" />
          
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Event Title</label>
            <input name="title" value={form.title} onChange={handleChange} required disabled={isLocked}
              className="input-paper-box text-lg font-serif italic text-ink-900 placeholder:text-ink-300 disabled:opacity-50" />
          </div>
          
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Narrative / Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={5} disabled={isLocked}
              className="input-paper-box min-h-[120px] resize-y disabled:opacity-50" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Temporal (Date)</label>
              <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required disabled={isLocked}
                className="input-paper-box [color-scheme:light] disabled:opacity-50" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Category</label>
              <select name="category" value={form.category} onChange={handleChange} disabled={isLocked}
                className="input-paper-box uppercase text-[10px] font-black tracking-widest cursor-pointer bg-white disabled:opacity-50">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Spatial (Location)</label>
            <input name="location" value={form.location} onChange={handleChange} required disabled={isLocked}
              className="input-paper-box disabled:opacity-50" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-paper-300">
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Capacity</label>
              <input type="number" name="totalSeats" min={1} value={form.totalSeats} onChange={handleChange} required disabled={isLocked}
                className="input-paper-box text-center font-mono font-bold disabled:opacity-50" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-2">Admission (₹)</label>
              <input type="number" name="ticketPrice" min={0} step="0.01" value={form.ticketPrice} onChange={handleChange} disabled={isLocked}
                className="input-paper-box text-center font-mono font-bold disabled:opacity-50" />
            </div>
          </div>
          
          <div className="pt-4">
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-500 block mb-4">Visual Composition</label>
            
            <div className="flex gap-4 mb-4">
              <button type="button" onClick={() => setImageMode('url')} disabled={isLocked} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 ${imageMode === 'url' ? 'border-amber-700 text-amber-700' : 'border-transparent text-ink-400 hover:text-ink-700 transition-colors'} disabled:opacity-50`}>URL Hash</button>
              <button type="button" onClick={() => setImageMode('upload')} disabled={isLocked} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 ${imageMode === 'upload' ? 'border-amber-700 text-amber-700' : 'border-transparent text-ink-400 hover:text-ink-700 transition-colors'} disabled:opacity-50`}>Local Upload</button>
            </div>

            {imageMode === 'url' ? (
              <input type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange} disabled={isLocked}
                placeholder="https://images.unsplash.com/..."
                className="input-paper-box text-[10px] text-ink-500 font-mono disabled:opacity-50" />
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isLocked}
                className="block w-full text-[10px] text-ink-500 font-mono file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-paper-200 file:text-ink-700 hover:file:bg-paper-300 cursor-pointer disabled:opacity-50" />
            )}
            {uploading && <p className="text-[10px] text-amber-600 mt-2 font-black tracking-widest uppercase">Uploading chunk...</p>}
          </div>
          
          <button type="submit" disabled={saving || isLocked}
            className="w-full py-6 text-[11px] uppercase tracking-widest font-black text-paper bg-amber-700 hover:bg-amber-800 transition-colors shadow-paper disabled:opacity-40 border-2 border-transparent">
            {saving ? 'Transcribing...' : 'Save Amendments'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
