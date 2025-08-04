import { fetchData } from '@/utils/axiosHelpers';

export const groupService = {
  createGroup: (data: FormData) =>
    fetchData(
      '/groups/create',
      {
        method: 'POST',
        data,
      },
      'Failed to create group'
    ),

  updateGroup: (groupId: string, data: FormData) =>
    fetchData(
      `/groups/update/${groupId}`,
      {
        method: 'PUT',
        data,
      },
      'Failed to update group'
    ),

  getGroupMessages: async (communityId: string, cursor?: string) => {
    const url = cursor
      ? `/groups/messages?communityId=${communityId}&before=${cursor}&limit=20`
      : `/groups/messages?communityId=${communityId}&limit=20`;

    return await fetchData(url, { method: 'GET' }, 'Failed to load messages');
  },

      getOlderMessages: (communityId: string, before: string) =>
    fetchData(
      `/groups/messages?communityId=${communityId}&before=${before}`,
      { method: 'GET' },
      'Failed to fetch older messages'
    ),

  getUserGroups: (userId: string) =>
    fetchData(
      `/groups/user/${userId}`,
      {
        method: 'GET',
      },
      'Failed to fetch user groups'
    ),
    
};
