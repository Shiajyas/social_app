import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/gropuService';

const useGroupMessages = (communityId: string) => {
  return useInfiniteQuery({
    queryKey: ['groupMessages', communityId],
    queryFn: ({ pageParam }) =>
      groupService.getGroupMessages(communityId, pageParam),
    enabled: !!communityId,
    initialPageParam: undefined, // Add this line
    getNextPageParam: (lastPage) =>
      lastPage.length > 0 ? lastPage[0].timestamp : undefined, // use oldest as cursor
  });
};

export default useGroupMessages;
