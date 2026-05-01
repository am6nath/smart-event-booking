import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const normalizeUser = (u) => ({
  id: u.id || u._id,
  name: u.name,
  email: u.email,
  role: u.role
});

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        const u = data.user;
        setProfile({
          name: u.name || '',
          email: u.email || ''
        });
      } catch {
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name: profile.name.trim(),
        email: profile.email.trim()
      });
      const nu = normalizeUser(data.user);
      updateUser(nu);
      toast.success(data.message || 'Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword
      });
      toast.success('Password changed — please sign in again');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwdLoading(false);
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
    <div className="page-wrapper py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-ink-400 hover:text-forest-700 transition-colors mb-8 inline-block">← Return Home</Link>
        
        <header className="mb-12 border-b-2 border-forest-700 pb-6">
          <h1 className="text-5xl font-serif italic font-bold text-ink-900 mb-2">Account Registry</h1>
          <p className="text-sm font-sans text-ink-500">
            Authenticated as <span className="font-mono text-ink-900 font-bold bg-paper-200 px-2 py-0.5 border border-paper-300 ml-1">{user?.email}</span>
            <span className="mx-3 text-paper-300">|</span>
            Clearance Level: <span className="text-[10px] uppercase tracking-widest font-black text-forest-700 ml-1 border border-forest-200 bg-forest-50 px-2 py-0.5">{user?.role}</span>
          </p>
        </header>

        <div className="bg-paper border-2 border-forest-700/20 shadow-paper p-8 mb-12">
          <h2 className="text-2xl font-serif italic font-bold text-ink-900 mb-6 border-b-2 border-dashed border-paper-300 pb-4">Identity File</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-ink-500 mb-2">Designation</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="input-paper-box w-full max-w-md"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-ink-500 mb-2">Communication Channel</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="input-paper-box w-full max-w-md"
                required
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-forest shadow-paper"
              >
                {saving ? 'Transcribing...' : 'Commit Changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-paper border-2 border-paper-300 shadow-paper p-8">
          <h2 className="text-2xl font-serif italic font-bold text-ink-900 mb-6 border-b-2 border-dashed border-paper-300 pb-4">Security Credentials</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-ink-500 mb-2">Current Secret</label>
              <input
                type="password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                className="input-paper-box w-full max-w-md"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-ink-500 mb-2">New Secret</label>
              <input
                type="password"
                value={pwd.newPassword}
                onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                className="input-paper-box w-full max-w-md"
                required
                minLength={6}
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={pwdLoading}
                className="btn-outline-forest shadow-none"
              >
                {pwdLoading ? 'Rotating...' : 'Rotate Credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
