import { useEffect, useState } from 'react';
import api from '../../api/axios';
import ManagementTable from './ManagementTable';

const UsersTab = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/auth/list', { params: { role: 'user' } });
      setRows(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    await api.put(`/auth/${id}/status`, { status });
    await load();
  };

  const handleDelete = async (id) => {
    await api.delete(`/auth/${id}`);
    await load();
  };

  return (
    <div className="space-y-4">
      {error && <p className="error-text">{error}</p>}
      <ManagementTable
        title="Users"
        columns={[]}
        rows={rows}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default UsersTab;
