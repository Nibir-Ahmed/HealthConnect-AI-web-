import React, { useState, useEffect } from 'react';
import db from '../../services/db';
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const UserDirectoryPage = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    return db.subscribe('users', (list) => {
      const byEmail = new Map();
      for (const u of list || []) {
        const key = (u.email || u.id || '').toLowerCase();
        if (!byEmail.has(key) || u.createdAt) {
          byEmail.set(key, u);
        }
      }
      setUsers(Array.from(byEmail.values()));
    });
  }, []);

  const handleRoleChange = (userId, newRole) => {
    db.update('users', userId, { role: newRole });
    if (newRole === 'doctor') {
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        const cleanName = (targetUser.name || 'Doctor').trim();
        db.update('doctors', userId, {
          id: userId,
          userId,
          name: cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`,
          email: targetUser.email || '',
          specialty: targetUser.specialty || 'General Physician',
          avatar: targetUser.avatar || '',
          experience: 1,
          consultationFee: 500,
          isVerified: false,
          isOnline: true,
          availability: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
          createdAt: targetUser.createdAt || new Date().toISOString(),
        });
      }
    }
    setNotification(`Successfully updated role to '${newRole}'.`);
    setTimeout(() => setNotification(''), 2500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Manage Users</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          View registered patients, doctors, and administrators across the platform.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['all', 'patient', 'doctor', 'admin'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                roleFilter === role
                  ? 'bg-[#2A9D8F] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {role} ({users.filter((u) => (role === 'all' ? true : u.role === role)).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#2A9D8F]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-6">User Account</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Registered On</th>
                <th className="py-3.5 px-6">Role Classification</th>
                <th className="py-3.5 px-6 text-right">Role Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={userItem.avatar || 'https://ui-avatars.com/api/?name=User'}
                        alt={userItem.name}
                        className="w-9 h-9 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{userItem.name}</p>
                        <p className="text-[11px] text-gray-400">{userItem.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-gray-600 font-mono">
                    {userItem.phoneNumber || <span className="text-gray-400 italic">Not set</span>}
                  </td>

                  <td className="py-4 px-6 text-gray-500">
                    {userItem.createdAt && !isNaN(new Date(userItem.createdAt).getTime())
                      ? new Date(userItem.createdAt).toLocaleDateString()
                      : 'Recently'}
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        userItem.role === 'admin'
                          ? 'bg-purple-50 text-purple-700'
                          : userItem.role === 'doctor'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      {userItem.role}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <select
                      id={`role-select-${userItem.id}`}
                      name={`userRole_${userItem.id}`}
                      aria-label={`Change role for ${userItem.name}`}
                      value={userItem.role}
                      onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                      className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#2A9D8F] cursor-pointer"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDirectoryPage;
