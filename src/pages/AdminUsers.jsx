import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getAdminUsers } from '../services/adminService';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="text-slate-500">Loading users...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">All registered platform users</p>
        </div>
      </div>

      <Card className="p-0">
        <CardHeader title={`Registered Users (${users.length})`} className="mb-0 pt-6 px-6" />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Analyses</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Reports</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-slate-900">{user.username}</div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ROLE_ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{user.analysisCount}</td>
                    <td className="py-3 px-4 text-slate-600">{user.reportCount}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 text-xs font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
