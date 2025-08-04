import { X, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface FriendsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (userId: string) => void;
}

const FriendsListModal: React.FC<FriendsListModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredUsers = useMemo(
    () =>
      searchTerm.trim()
        ? users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        : users,
    [searchTerm, users],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md border rounded-xl shadow-xl p-5 bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-3 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Friends List</h3>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-md">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search friends..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-64 no-s no-scrollbar  overflow-y-auto space-y-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                onClick={() => {
                  onSelectUser(user._id);
                  onClose();
                }}
                tabIndex={0}
                role="button"
                aria-label={`Select ${user.username}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || '/user.png'}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-500 py-4">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsListModal;
