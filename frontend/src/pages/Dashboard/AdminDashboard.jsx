import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Calendar, Ticket, Settings, 
  Search, Bell, Menu, CloudDownload, 
  MessageCircle, Eye, Heart, TrendingUp, Trash2, CheckCircle, XCircle, UserPlus, Edit
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Paper/Forest Chart Colors
const COLORS = ['#2D5A27', '#4E8F43', '#A09170']; 

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // User CRUD State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentUserForm, setCurrentUserForm] = useState({ name: '', email: '', password: '', role: 'user', _id: null });

  // Search States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  // Filtered lists
  const filteredUsers = users.filter(u => {
    if (u.role === 'admin') return false;
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });
  const filteredEvents = events.filter(ev =>
    ev.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
    ev.location?.toLowerCase().includes(eventSearch.toLowerCase()) ||
    ev.organizerId?.name?.toLowerCase().includes(eventSearch.toLowerCase())
  );
  const filteredBookings = bookings.filter(bk =>
    bk.userId?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    bk.userId?.email?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    bk.eventId?.title?.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users?limit=50');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/events?limit=50');
      setEvents(res.data.events);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings?limit=50');
      setBookings(res.data.bookings);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') fetchDashboardStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab]);

  const handleApproveEvent = async (eventId, action) => {
    const reason = action === 'reject' ? prompt('Enter rejection reason:') : '';
    if (action === 'reject' && !reason) return;
    try {
      await api.put(`/admin/events/${eventId}/approve`, { action, rejectionReason: reason });
      toast.success(`Event ${action}d successfully`);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} event`);
    }
  };

  const handleApproveEventUpdate = async (eventId, action) => {
    if (action === 'reject' && !window.confirm('Are you sure you want to reject this update request?')) return;
    try {
      await api.put(`/admin/events/${eventId}/approve-update`, { action });
      toast.success(`Update request ${action}d successfully`);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} update request`);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event and all its bookings?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete user AND all their events/bookings? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openUserModal = (mode, user = null) => {
    setModalMode(mode);
    if (mode === 'edit' && user) {
      setCurrentUserForm({
        _id: user._id,
        name: user.name,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setCurrentUserForm({ name: '', email: '', password: '', role: 'user', _id: null });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await api.post('/admin/users', currentUserForm);
        toast.success('User created successfully');
      } else {
        const { _id, ...updateData } = currentUserForm;
        if (!updateData.password) delete updateData.password;
        await api.put(`/admin/users/${_id}`, updateData);
        toast.success('User updated successfully');
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${modalMode} user`);
    }
  };

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Users Management', icon: <Users size={18} /> },
    { id: 'events', label: 'Events Management', icon: <Calendar size={18} /> },
    { id: 'bookings', label: 'Bookings Log', icon: <Ticket size={18} /> },
    { id: 'settings', label: 'Platform Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-paper text-ink-900 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-paper-50 border-r-2 border-forest-700/30 flex flex-col z-20`}>
        <div className="h-16 flex items-center justify-center border-b-2 border-forest-700/20">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 font-serif italic font-bold text-xl text-ink-900">
              <div className="w-8 h-8 bg-forest-700 text-paper px-1 rounded-sm border-2 border-forest-800 flex justify-center items-center">
                 E
              </div>
              EventHub<span className="text-forest-600 not-italic">.</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-forest-700 text-paper font-serif italic text-lg px-1 rounded-sm border-2 border-forest-800 flex justify-center items-center">
               E
            </div>
          )}
        </div>
        
        {sidebarOpen && (
          <div className="p-6 flex flex-col items-center border-b-2 border-forest-700/20 pb-8 bg-paper">
            <div className="w-16 h-16 rounded-full bg-paper-200 overflow-hidden mb-3 border-2 border-forest-700 p-0.5">
              <img src="https://i.pravatar.cc/150?img=11" alt="Admin" className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className="font-serif italic text-lg text-ink-900 font-bold">Admin Portal</h3>
            <div className="flex gap-4 text-ink-500 mt-2">
              <Settings size={16} className="hover:text-forest-700 cursor-pointer transition-colors" />
              <Bell size={16} className="hover:text-forest-700 cursor-pointer transition-colors" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          {sidebarOpen && <div className="px-6 text-[9px] font-black text-ink-400 uppercase tracking-[0.2em] mb-4">Command Center</div>}
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${sidebarOpen ? 'px-6' : 'justify-center'} py-3.5 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === item.id 
                    ? 'bg-forest-50 text-forest-700 border-r-4 border-forest-700' 
                    : 'text-ink-500 hover:text-forest-700 hover:bg-paper-100'
                }`}
              >
                <span className={`${sidebarOpen ? 'mr-3' : ''}`}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-paper">
        
        {/* Header */}
        <header className="h-16 bg-paper border-b-2 border-forest-700/20 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0 shadow-[0_2px_0_rgba(45,90,39,0.05)]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-ink-500 hover:text-forest-700 focus:outline-none">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center text-[10px] font-black uppercase tracking-widest text-ink-400">
              <span>Admin</span>
              <span className="mx-3 text-ink-300">/</span>
              <span className="text-forest-700 decoration-forest-700 underline underline-offset-4">{activeTab}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-ink-500 hover:text-forest-700">
              <Search size={18} />
            </button>
            <button className="text-ink-500 hover:text-forest-700 relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border border-paper"></span>
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 lg:p-10">
          {loading && (
            <div className="flex items-center justify-center h-full">
               <div className="inline-block animate-spin h-10 w-10 border-4 border-paper-300 border-t-forest-700 rounded-full"></div>
            </div>
          )}

          {!loading && activeTab === 'analytics' && (
             <div className="space-y-8 animate-slideUp">
               
               {/* 5 Top Stats */}
               <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                 <div className="paper-card flex flex-col p-6 items-center justify-center border-2 border-forest-700">
                   <div className="text-forest-700 mb-3"><TrendingUp size={24} /></div>
                   <h3 className="text-3xl font-serif italic font-bold text-ink-900">{stats?.users?.total || 0}</h3>
                   <p className="text-[9px] text-ink-500 mt-2 uppercase tracking-[0.2em] font-black">Users</p>
                 </div>
                 <div className="paper-card flex flex-col p-6 items-center justify-center border-2 border-forest-700/30">
                   <div className="text-earth-600 mb-3"><CloudDownload size={24} /></div>
                   <h3 className="text-3xl font-serif italic font-bold text-ink-900">{stats?.events?.approved || 0}</h3>
                   <p className="text-[9px] text-ink-500 mt-2 uppercase tracking-[0.2em] font-black">Active Events</p>
                 </div>
                 <div className="paper-card flex flex-col p-6 items-center justify-center border-2 border-forest-700/30">
                   <div className="text-forest-600 mb-3"><MessageCircle size={24} /></div>
                   <h3 className="text-3xl font-serif italic font-bold text-ink-900">{stats?.bookings?.total || 0}</h3>
                   <p className="text-[9px] text-ink-500 mt-2 uppercase tracking-[0.2em] font-black">Bookings</p>
                 </div>
                 <div className="paper-card flex flex-col p-6 items-center justify-center border-2 border-forest-700/30">
                   <div className="text-amber-600 mb-3"><Eye size={24} /></div>
                   <h3 className="text-3xl font-serif italic font-bold text-ink-900">{stats?.events?.pending || 0}</h3>
                   <p className="text-[9px] text-ink-500 mt-2 uppercase tracking-[0.2em] font-black">Pending</p>
                 </div>
                 <div className="paper-card flex flex-col p-6 items-center justify-center border-2 bg-forest-50 border-forest-700 shadow-paper">
                   <div className="text-forest-700 mb-3"><Heart size={24} /></div>
                   <h3 className="text-2xl lg:text-3xl font-serif italic font-bold text-forest-800">
                     ₹{stats?.revenue?.totalRevenue?.toLocaleString() || 0}
                   </h3>
                   <p className="text-[9px] text-forest-600 mt-2 uppercase tracking-[0.2em] font-black">Revenue</p>
                 </div>
               </div>

               {/* Charts Row */}
               <div className="grid lg:grid-cols-3 gap-8">
                 {/* Bar Chart */}
                 <div className="lg:col-span-2 paper-card p-8 border-2 border-paper-300">
                   <div className="flex items-center justify-between mb-8 border-b-2 border-dashed border-paper-300 pb-4">
                     <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-700">Traffic vs Sales Registry</h3>
                   </div>
                   <div className="h-72 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats?.chartData?.trafficSales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E8E0C8" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B6B52', fontSize: 10, fontFamily: 'DM Mono'}} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B6B52', fontSize: 10, fontFamily: 'DM Mono'}} />
                         <Tooltip cursor={{fill: '#F2EDD8'}} contentStyle={{ borderRadius: '0', border: '2px solid #2D5A27', backgroundColor: '#FAF7F0', fontFamily: 'DM Mono', fontSize: '12px' }} />
                         <Bar dataKey="traffic" fill="#A09170" barSize={16} name="Tickets Sold" />
                         <Bar dataKey="sales" fill="#2D5A27" barSize={16} name="Revenue (₹)" />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 {/* Doughnut Chart */}
                 <div className="paper-card p-8 border-2 border-paper-300">
                   <div className="flex items-center justify-between mb-8 border-b-2 border-dashed border-paper-300 pb-4">
                     <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-700">Tickets By Category</h3>
                   </div>
                   <div className="h-56 w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={stats?.chartData?.category || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                           {(stats?.chartData?.category || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '0', border: '2px solid #2D5A27', backgroundColor: '#FAF7F0', fontFamily: 'DM Mono', fontSize: '12px' }} />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex justify-center flex-wrap gap-4 mt-6">
                     {(stats?.chartData?.category || []).map((entry, index) => (
                       <div key={entry.name} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink-700">
                         <span className="w-2.5 h-2.5 border border-ink-900" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                         {entry.name}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Bottom Row */}
               <div className="grid lg:grid-cols-2 gap-8">
                 <div className="bg-paper p-8 border-2 border-forest-700 shadow-paper">
                     <h3 className="text-lg font-serif italic text-ink-900 mb-1 border-b-2 border-forest-700 pb-2">Pending Approvals</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 mt-2 mb-6">{stats?.pendingApprovalEvents?.length || 0} event drafts queued</p>
                     
                     <div className="space-y-0 divide-y-2 divide-dashed divide-paper-300">
                       {(stats?.pendingApprovalEvents || []).map(ev => (
                         <div key={ev._id} className="py-4 flex justify-between items-center group">
                           <div>
                             <p className="font-serif font-bold text-ink-900 text-lg group-hover:text-forest-700">{ev.title}{ev.editRequestStatus === 'pending' && <span className="ml-2 text-[8px] font-sans font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 border border-amber-200 align-middle">Amend Req</span>}</p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 mt-1">Org: {ev.organizerId?.name}</p>
                           </div>
                           <button onClick={() => setActiveTab('events')} className="btn-ghost-forest shadow-sm text-[9px] px-3">
                             Review
                           </button>
                         </div>
                       ))}
                       {(!stats?.pendingApprovalEvents || stats.pendingApprovalEvents.length === 0) && (
                         <div className="py-8 text-[11px] font-black uppercase tracking-widest text-ink-400 text-center">Queue is empty</div>
                       )}
                     </div>
                 </div>
                 
                 <div className="bg-paper p-8 border-2 border-paper-300 shadow-paper">
                     <h3 className="text-lg font-serif italic text-ink-900 mb-1 border-b-2 border-paper-300 pb-2">Recent Transactions</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 mt-2 mb-6">Latest platform tickets</p>
                     
                     <div className="space-y-0 divide-y-2 divide-dashed divide-paper-300">
                       {(stats?.recentBookings || []).map(bk => (
                         <div key={bk._id} className="py-4 flex justify-between items-center">
                           <div>
                             <p className="font-sans font-bold text-ink-900 truncate max-w-[200px]">{bk.eventId?.title}</p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 mt-1">
                               {bk.userId?.name} <span className="mx-2">|</span> <span className="font-mono text-forest-700">₹{((bk.quantity || 1) * (bk.eventId?.ticketPrice || 0)).toLocaleString()}</span>
                             </p>
                           </div>
                           <span className="badge-forest text-[9px]">
                             {bk.status}
                           </span>
                         </div>
                       ))}
                        {(!stats?.recentBookings || stats.recentBookings.length === 0) && (
                         <div className="py-8 text-[11px] font-black uppercase tracking-widest text-ink-400 text-center">No ledger entries</div>
                       )}
                     </div>
                 </div>
               </div>
             </div>
          )}

          {!loading && activeTab === 'users' && (
            <div className="bg-paper border-2 border-forest-700 shadow-paper animate-slideUp">
              <div className="p-6 border-b-2 border-forest-700 bg-forest-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif italic font-bold text-forest-900">User Ledger</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-forest-600 mt-1">Manage accounts & roles</p>
                  </div>
                  <button onClick={() => openUserModal('create')} className="btn-forest flex items-center gap-2 !py-2 !px-4 !text-[10px]">
                    <UserPlus size={16} /> Create New User
                  </button>
                </div>
                <div className="flex gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="input-paper-box w-full !pl-9 !py-2 !text-[11px] !font-mono"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {['all', 'user', 'organizer'].map(role => (
                      <button
                        key={role}
                        onClick={() => setUserRoleFilter(role)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                          userRoleFilter === role
                            ? 'bg-forest-700 border-forest-700 text-paper'
                            : 'bg-paper border-paper-300 text-ink-500 hover:border-forest-700 hover:text-forest-700'
                        }`}
                      >
                        {role === 'all' ? 'All' : role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="paper-table">
                  <thead className="bg-paper-50 !border-b-2 !border-forest-700">
                    <tr>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Account</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Access Tier</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Registry Date</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-dashed divide-paper-300">
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="hover:bg-paper-100">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 font-serif italic text-lg border-2 border-forest-700 bg-forest-50 text-forest-800 flex items-center justify-center shadow-sm">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-ink-900 font-sans">{u.name}</p>
                              <p className="text-[10px] font-mono text-ink-500 mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <select 
                             value={u.role}
                             onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                             className="input-paper-box !py-1.5 !px-2 w-auto bg-paper cursor-pointer !text-xs !font-black !uppercase !tracking-widest"
                           >
                              <option value="user">User</option>
                              <option value="organizer">Organizer</option>
                           </select>
                        </td>
                        <td className="px-6 py-4 text-ink-500 text-[11px] font-mono font-bold">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => openUserModal('edit', u)} className="btn-ghost-forest !text-[9px] !px-2 !py-1 text-forest-700 mr-2 hover:bg-forest-50" title="Edit User">
                              Edit
                           </button>
                           <button onClick={() => handleDeleteUser(u._id)} className="btn-ghost-forest !text-[9px] !px-2 !py-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" title="Delete User">
                              Revoke
                           </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-12 text-[10px] font-black tracking-[0.3em] uppercase text-ink-400">Vault Empty</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === 'events' && (
            <div className="bg-paper border-2 border-forest-700 shadow-paper animate-slideUp">
              <div className="p-6 border-b-2 border-forest-700 bg-forest-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif italic font-bold text-forest-900">Event Archive Oversight</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-forest-600 mt-1">Approve, reject, edit or issue new events</p>
                  </div>
                  <button onClick={() => navigate('/events/create')} className="btn-forest flex items-center gap-2 !py-2 !px-4 !text-[10px]">
                    <Calendar size={16} /> Create Premium Event
                  </button>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search by title, location or organiser…"
                    value={eventSearch}
                    onChange={e => setEventSearch(e.target.value)}
                    className="input-paper-box w-full !pl-9 !py-2 !text-[11px] !font-mono"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="paper-table">
                  <thead className="bg-paper-50 !border-b-2 !border-forest-700">
                    <tr>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Title & Location</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Submitter</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">State</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Date Log</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500 text-right">Sanctions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-dashed divide-paper-300">
                    {filteredEvents.map(ev => (
                      <tr key={ev._id} className="hover:bg-paper-100">
                        <td className="px-6 py-4">
                          <p className="font-bold font-serif text-ink-900 text-base">{ev.title}</p>
                          <p className="text-[10px] font-mono text-ink-500 mt-1 uppercase truncate max-w-[200px]">{ev.location}</p>
                        </td>
                        <td className="px-6 py-4 font-sans text-sm font-bold text-ink-700">
                          {ev.organizerId?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${
                            ev.status === 'approved' ? 'badge-forest' :
                            ev.status === 'pending' ? 'badge-pending' :
                            'badge-danger'
                          } !text-[9px]`}>
                            {ev.status}
                          </span>
                          {ev.editRequestStatus === 'pending' && (
                            <span className="block mt-1 text-[8px] font-black text-amber-600 uppercase tracking-widest">Amend Req.</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink-500 text-[11px] font-mono font-bold">
                          {new Date(ev.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-3">
                             {ev.status === 'pending' && (
                               <>
                                 <button onClick={() => handleApproveEvent(ev._id, 'approve')} className="text-forest-600 hover:text-forest-800 transition-transform hover:scale-110">
                                    <CheckCircle size={18} />
                                 </button>
                                 <button onClick={() => handleApproveEvent(ev._id, 'reject')} className="text-red-600 hover:text-red-800 transition-transform hover:scale-110">
                                    <XCircle size={18} />
                                 </button>
                               </>
                             )}
                             {ev.status === 'approved' && ev.editRequestStatus === 'pending' && (
                               <>
                                 <button onClick={() => handleApproveEventUpdate(ev._id, 'approve')} className="text-forest-600 hover:text-forest-800 transition-transform hover:scale-110" title="Approve Update Access">
                                    <CheckCircle size={18} />
                                 </button>
                                 <button onClick={() => handleApproveEventUpdate(ev._id, 'reject')} className="text-red-600 hover:text-red-800 transition-transform hover:scale-110" title="Reject Update Access">
                                    <XCircle size={18} />
                                 </button>
                               </>
                             )}
                             <span className="text-paper-300 mx-1">|</span>
                             <button onClick={() => navigate(`/events/${ev._id}/edit`)} className="text-ink-400 hover:text-forest-600 transition-transform hover:scale-110" title="Edit Event Details">
                                <Edit size={16} />
                             </button>
                             <button onClick={() => handleDeleteEvent(ev._id)} className="text-ink-400 hover:text-red-600 transition-transform hover:scale-110" title="Delete Event">
                                <Trash2 size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-12 text-[10px] font-black tracking-[0.3em] uppercase text-ink-400">Registry Empty</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === 'bookings' && (
            <div className="bg-paper border-2 border-forest-700 shadow-paper animate-slideUp">
              <div className="p-6 border-b-2 border-forest-700 bg-forest-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif italic font-bold text-forest-900">Ledger Transactions</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-forest-600 mt-1">Global registry of secure passes</p>
                  </div>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search by attendee name, email or event…"
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    className="input-paper-box w-full !pl-9 !py-2 !text-[11px] !font-mono"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="paper-table">
                  <thead className="bg-paper-50 !border-b-2 !border-forest-700">
                    <tr>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">TKT #</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Destination</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Attendee</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">Condition</th>
                      <th className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-dashed divide-paper-300">
                    {filteredBookings.map(bk => (
                      <tr key={bk._id} className="hover:bg-paper-100">
                        <td className="px-6 py-4 font-mono text-[10px] font-bold text-forest-700 border-r-2 border-dashed border-paper-300 bg-forest-50/50">
                          {bk.ticketId || bk._id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-serif italic font-bold text-ink-900">{bk.eventId?.title}</p>
                          <p className="text-[10px] font-mono text-ink-500 mt-1">{new Date(bk.eventId?.date).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-ink-900 font-sans font-bold text-sm">{bk.userId?.name}</p>
                          <p className="text-[10px] font-mono text-ink-500 mt-0.5">{bk.userId?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`!text-[9px] ${bk.status === 'confirmed' ? 'badge-forest' : 'badge-danger'}`}>
                            {bk.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="font-bold font-sans text-ink-900 text-base">₹{((bk.quantity || 1) * (bk.eventId?.ticketPrice || 0)).toLocaleString()}</span>
                          <p className="text-[10px] font-black uppercase tracking-widest text-ink-500 mt-1">{bk.quantity} seats</p>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-12 text-[10px] font-black tracking-[0.3em] uppercase text-ink-400">Ledger Empty</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* User Management Form Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="bg-paper border-2 border-forest-700 shadow-paper w-full max-w-md animate-slideUp relative">
            <button 
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-red-600 transition-colors"
            >
              <XCircle size={20} />
            </button>
            
            <div className="p-6 border-b-2 border-forest-700 bg-forest-50">
              <h2 className="text-2xl font-serif italic font-bold text-forest-900">
                {modalMode === 'create' ? 'Create New User' : 'Amend Record'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-forest-600 mt-1">
                {modalMode === 'create' ? 'Register a new identity in the ledger' : 'Modify user credentials'}
              </p>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={currentUserForm.name}
                  onChange={(e) => setCurrentUserForm({...currentUserForm, name: e.target.value})}
                  className="input-paper w-full"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={currentUserForm.email}
                  onChange={(e) => setCurrentUserForm({...currentUserForm, email: e.target.value})}
                  className="input-paper w-full"
                  placeholder="Registry email address"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink-700 mb-1">
                  Password {modalMode === 'edit' && <span className="text-forest-600 text-[8px]">(Leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={modalMode === 'create'}
                  minLength={6}
                  value={currentUserForm.password}
                  onChange={(e) => setCurrentUserForm({...currentUserForm, password: e.target.value})}
                  className="input-paper w-full"
                  placeholder={modalMode === 'create' ? "Minimum 6 characters" : "New password (optional)"}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink-700 mb-1">Access Tier</label>
                <select
                  value={currentUserForm.role}
                  onChange={(e) => setCurrentUserForm({...currentUserForm, role: e.target.value})}
                  className="input-paper-box w-full"
                >
                  <option value="user">User (Standard)</option>
                  <option value="organizer">Organizer (Event Creator)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t-2 border-dashed border-paper-300">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-ghost-forest px-4">
                  Discard
                </button>
                <button type="submit" className="btn-forest px-6">
                  {modalMode === 'create' ? 'Inscribe' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;