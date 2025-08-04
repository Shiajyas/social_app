import { useQuery } from '@tanstack/react-query';
import { useGroupStore } from '@/appStore/groupStore';
import { groupService } from '@/services/gropuService';

export const useGroups = (userId: string) => {
  const { setGroups } = useGroupStore();

  return useQuery({
    queryKey: ['groups', userId],
    queryFn: async () => {
      const groups = await groupService.getUserGroups(userId);
      setGroups(groups); 
      return groups;
    },
    enabled: !!userId,
  });
};
