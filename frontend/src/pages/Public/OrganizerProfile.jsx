import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/axios';
import { toast } from 'react-toastify';

const OrganizerProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await api.get(`/organizers/${id}`);
        setData(res.data);
      } catch {
        toast.error('Organizer not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <Link to="/events" className="text-red-400">← Events</Link>
      </div>
    );
  }

  const { organizer, stats, events } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/events" className="text-sm text-gray-400 hover:text-white">← Events</Link>
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-3xl font-bold">{organizer.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{organizer.email}</p>
          <span className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full bg-red-500/20 text-red-300">
            {organizer.trustScore}
          </span>
          <div className="grid grid-cols-3 gap-4 mt-8 text-center">
            <div className="bg-black/30 rounded-xl py-4">
              <p className="text-2xl font-bold text-red-400">{stats.totalEvents}</p>
              <p className="text-xs text-gray-500 uppercase">Events</p>
            </div>
            <div className="bg-black/30 rounded-xl py-4">
              <p className="text-2xl font-bold text-red-400">{stats.approvedEvents}</p>
              <p className="text-xs text-gray-500 uppercase">Approved</p>
            </div>
            <div className="bg-black/30 rounded-xl py-4">
              <p className="text-2xl font-bold text-red-400">{stats.totalAttendees}</p>
              <p className="text-xs text-gray-500 uppercase">Attendees</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold mt-10 mb-4">Public schedule</h2>
        <ul className="space-y-3">
          {(events || []).map((ev) => (
            <li key={ev._id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <span className="font-medium truncate pr-4">{ev.title}</span>
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {new Date(ev.date).toLocaleDateString()} · {ev.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrganizerProfile;
