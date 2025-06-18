import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminOverviewService } from '@/services/adminService';

const defaultPermissions = {
  dashboard: true,
  subscription: false,
  spam: false,
  users: false,
  RoleManagement: false,
};

type Permissions = typeof defaultPermissions;

type AdminEntry = {
  _id: string;
  email: string;
  userName: string;
  roleName: string;
  createdAt: string;
  permissions: Permissions;
};

const RoleManagement: React.FC = () => {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [permissions, setPermissions] = useState<Permissions>({ ...defaultPermissions });
  const [allPermissions, setAllPermissions] = useState(false);
  const [error, setError] = useState('');

  const { data: fetchedAdmins = [], refetch: refetchAdmins } = useQuery({
    queryKey: ['getAllAdmins'],
    queryFn: adminOverviewService.getAllAdmins,
  });

  const { mutate: createAdmin, isPending } = useMutation({
    mutationFn: adminOverviewService.createAdmin,
    onSuccess: () => {
      alert('✅ Admin created successfully');
      refetchAdmins();
      resetForm();
    },
    onError: (err: any) => {
      console.error('Create admin error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create admin');
    },
  });

  const { mutate: deleteAdmin } = useMutation({
    mutationFn: adminOverviewService.deleteAdmin,
    onSuccess: () => {
      refetchAdmins();
    },
    onError: (err: any) => {
      console.error('Delete admin error:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to delete admin');
    },
  });

  const resetForm = () => {
    setEmail('');
    setUserName('');
    setRoleName('');
    setPassword('');
    setConfirmPassword('');
    setPermissions({ ...defaultPermissions });
    setAllPermissions(false);
    setError('');
  };

  useEffect(() => {
    const isAllChecked = Object.entries(permissions).every(
      ([key, value]) => key === 'dashboard' || value
    );
    setAllPermissions(isAllChecked);
  }, [permissions]);

  const togglePermission = (key: keyof Permissions) => {
    if (key === 'dashboard') return;
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('❌ Passwords do not match.');
      return;
    }

    createAdmin({ email, username: userName, roleName, password, permissions });
  };

  const toggleAllPermissions = () => {
    const updated = Object.keys(defaultPermissions).reduce((acc, key) => {
      acc[key as keyof Permissions] = key === 'dashboard' ? true : !allPermissions;
      return acc;
    }, {} as Permissions);
    setPermissions(updated);
    setAllPermissions(!allPermissions);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Create Admin Role</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirm Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Permissions</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center w-full md:w-[250px] cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                checked={allPermissions}
                onChange={toggleAllPermissions}
              />
              <span className="font-semibold">All Permissions</span>
            </label>

            {Object.entries(permissions).map(([key, value]) => (
              <label key={key} className="flex items-center w-full md:w-[250px] cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={value}
                  disabled={key === 'dashboard'}
                  onChange={() => togglePermission(key as keyof Permissions)}
                />
                <span className="capitalize">
                  {key === 'dashboard'
                    ? 'Dashboard (Always Enabled)'
                    : `${key.charAt(0).toUpperCase()}${key.slice(1)} Management`}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700"
        >
          {isPending ? 'Creating...' : 'Create Admin'}
        </button>
      </form>

      {/* Admin List */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Admin List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-300 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Created At</th>
                <th className="p-2 border">Permissions</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fetchedAdmins.length > 0 ? (
                fetchedAdmins.map((admin) => (
                  <tr key={admin._id} className="border-t dark:border-gray-600">
                    <td className="p-2 border">{admin.email}</td>
                    <td className="p-2 border">{admin.roleName}</td>
                    <td className="p-2 border">
                      {new Date(admin.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 border text-sm">
                      {Object.entries(admin.permissions)
                        .filter(([_, v]) => v)
                        .map(([perm]) => (
                          <span
                            key={perm}
                            className="inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-1 rounded mr-1 mb-1"
                          >
                            {perm === 'dashboard'
                              ? 'Dashboard'
                              : `${perm.charAt(0).toUpperCase()}${perm.slice(1)}`}
                          </span>
                        ))}
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() => {
                          if (confirm(`Delete admin ${admin.email}?`)) {
                            deleteAdmin(admin._id);
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No admins created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
