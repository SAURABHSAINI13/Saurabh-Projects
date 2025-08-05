// src/components/UserSelector.jsx
import { useEffect, useState } from 'react';
import { request } from '../api/client.js';

export default function UserSelector({ roleFilter, onSelect, selectedId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      const data = await request(`/users?${params.toString()}`);
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  return (
    <div>
      <label>
        Select {roleFilter || 'User'}:{' '}
        <select value={selectedId} onChange={(e) => onSelect(e.target.value)} disabled={loading}>
          <option value="">-- choose --</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.roles.join(',')})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
