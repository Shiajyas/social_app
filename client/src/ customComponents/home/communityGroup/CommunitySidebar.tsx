import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/appStore/AuthStore';
import { ChevronLeft, ChevronRight, Users, MoreVertical } from 'lucide-react';
import { useGroupStore } from '@/appStore/groupStore';
import { useGroups } from '@/hooks/group/useGroups';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { socket as mainSocket } from '@/utils/Socket';
import { toast } from 'react-toastify';
import { set } from 'date-fns';

const LOCAL_STORAGE_KEY = 'isOpen';

export const GroupSidebar = ({ onSelectGroup }) => {
  const { user } = useAuthStore();
  const { groups, activeGroupId, setActiveGroup } = useGroupStore();

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [menuGroupId, setMenuGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'leave'; groupId: string } | null>(null);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(4);

  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch groups
  useGroups(user?._id);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuGroupId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Store sidebar state in localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  // Move group to top function
  const moveGroupToTop = (groupId: string) => {
    useGroupStore.setState((state) => {
      const updatedGroups = [...state.groups];
      const index = updatedGroups.findIndex((g) => g._id === groupId);
      if (index === -1) return state;
      const [group] = updatedGroups.splice(index, 1);
      updatedGroups.unshift({
        ...group,
        updatedAt: new Date().toISOString(),
      });
      return { groups: updatedGroups };
    });
  };

  // 🚀 Navigate cleanly when timer ends
  useEffect(() => {
    if ( timer === 0) {
      navigate('/home/community/*');
    }
  }, [ timer]);

  // Socket listeners
  useEffect(() => {
    const handleGroupDeleted = (data :{ groupId : string, user : string}) => {
      
      if((data.groupId == selectedGroupId)||(data.groupId == activeGroupId)){
        setMessage("This group has been deleted")
        setTimer(4)
          setSelectedGroupId(null);
        setActiveGroup(null);
            let countdown = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              setMessage("");
                queryClient.invalidateQueries({ queryKey: ['groups'] });
              clearInterval(countdown);
              return 0;
            }
            
            return prev - 1;
          });
        }, 1000);

        return
      }

      queryClient.invalidateQueries({ queryKey: ['groups'] });

     
    };

    const handleGroupUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    const handleGroupCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    const handleGroupRemoved = (data) => {
      if (
        (data.groupId === selectedGroupId && data.memberId === user?._id) ||
        (data.groupId === activeGroupId && data.memberId === user?._id)
      ) {
        setMessage("You have been removed by the admin");
        setTimer(4);

        setSelectedGroupId(null);
        setActiveGroup(null);

        // start countdown
        let countdown = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              setMessage("");
                queryClient.invalidateQueries({ queryKey: ['groups'] });
              clearInterval(countdown);
              return 0;
            }
            
            return prev - 1;
          });
        }, 1000);

        return;
      }

      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    const handleGroupMessage = ({ groupId }) => {
      moveGroupToTop(groupId);
    };

    mainSocket.on('group-deleted', handleGroupDeleted);
    mainSocket.on('group-updated', handleGroupUpdated);
    mainSocket.on('group-created', handleGroupCreated);
    mainSocket.on('group-message', handleGroupMessage);
    mainSocket.on('group-member-added', handleGroupUpdated);
    mainSocket.on('group-member-removed', handleGroupRemoved);

    return () => {
      mainSocket.off('group-deleted', handleGroupDeleted);
      mainSocket.off('group-updated', handleGroupUpdated);
      mainSocket.off('group-created', handleGroupCreated);
      mainSocket.off('group-message', handleGroupMessage);
      mainSocket.off('group-member-added', handleGroupUpdated);
      mainSocket.off('group-member-removed', handleGroupRemoved);
    };
  }, [selectedGroupId, navigate, queryClient, user?._id, activeGroupId, setActiveGroup]);

  // Handlers
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setActiveGroup(groupId);
    onSelectGroup(groupId);
    useGroupStore.getState().clearUnread(groupId);
  };

  const handleEdit = (groupId: string) => {
    navigate(`/home/community/${groupId}/edit`);
  };

  const onCreateGroup = () => {
    navigate('/home/community/create');
  };

  const confirmDelete = (groupId: string) => {
    setConfirmAction({ type: 'delete', groupId });
  };

  const viewGroup = (groupId: string) => {
    navigate(`/home/community/${groupId}/edit`);
  };

  const executeConfirmAction = () => {
    if (confirmAction?.type === 'delete') {
      mainSocket.emit('delete-group', { groupId: confirmAction.groupId });
    } else if (confirmAction?.type === 'leave') {
      mainSocket.emit('leave-group', { groupId: confirmAction.groupId, userId: user?._id });
    }
    setConfirmAction(null);
  };

  return (
    <div className="relative h-full">
      {/* Sidebar toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-4 top-4 z-10 bg-white dark:bg-gray-900 rounded-full p-1 shadow-md border dark:border-gray-700"
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 h-full bg-white dark:bg-gray-900 border-r ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="h-full flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-gray-600 dark:text-gray-300" size={20} />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Groups</span>
          </div>

          {/* Create group */}
          {isOpen && (
            <Button onClick={onCreateGroup} className="w-full mb-4">
              + Create Group
            </Button>
          )}

          {/* Group list */}
          <div className="flex-grow overflow-y-auto space-y-2 pr-2">
            {groups.map((group) => {
              const isAdmin = group?.creatorId._id === user?._id;
              const isSelected = selectedGroupId === group._id;
              const unreadCount = useGroupStore.getState().getUnreadCount(group._id);

              return (
                <div
                  key={group._id}
                  className={`relative hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded cursor-pointer ${
                    isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  <div
                    onClick={() => handleSelectGroup(group._id)}
                    className="flex justify-between items-start gap-2"
                  >
                    <img
                      src={group?.iconUrl}
                      alt={group?.creatorId?.name || 'Group Icon'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {group.name}
                        </div>
                        {unreadCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-500 text-white dark:bg-blue-600 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        <span className={group.lastMessage?.content ? "text-blue-500" : "text-gray-400 italic"}>
                          {group.lastMessage?.content || "no message yet"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuGroupId(menuGroupId === group._id ? null : group._id);
                        }}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                      >
                        <MoreVertical size={18} />
                      </button>
                    )}
                  </div>

                  {/* Modal for removal */}
                  {message && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                      <div className="bg-white text-black p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">{message}</h2>
                        <p className="text-lg">
                          Redirecting in <span className="font-semibold">{timer}</span> seconds...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dropdown */}
                  {menuGroupId === group._id && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-12 z-20 bg-white dark:bg-gray-800 border rounded shadow-md p-2 w-36"
                    >
                      {isAdmin ? (
                        <>
                          <div
                            onClick={() => handleEdit(group._id)}
                            className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            Edit
                          </div>
                          <div
                            onClick={() => confirmDelete(group._id)}
                            className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            Delete
                          </div>
                        </>
                      ) : (
                        <div
                          onClick={() => viewGroup(group._id)}
                          className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          View Group
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {confirmAction.type === 'delete' ? 'Delete Group' : 'Leave Group'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to{' '}
              <span className="font-semibold">
                {confirmAction.type === 'delete' ? 'delete' : 'leave'}
              </span>{' '}
              this group?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={executeConfirmAction}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
