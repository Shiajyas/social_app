import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '@/appStore/groupStore';
import GroupDetails from './GroupCreateForm';

const GroupDetailsWrapper: React.FC = () => {
  const { communityId } = useParams();
  const { groups } = useGroupStore();
  const navigate = useNavigate();

  console.log(groups, communityId);
  

  const groupData = groups.find((g) => g._id === communityId);

  if (!groupData) {
    return null;
  }

  return (
<div className=''>
      <GroupDetails
      groupData={groupData}
      
      onClose={() => navigate(`/home/community/${communityId}`)}
    />
</div>
  );
};

export default GroupDetailsWrapper;
