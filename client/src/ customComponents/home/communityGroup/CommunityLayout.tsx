import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GroupSidebar } from './CommunitySidebar';
import GroupDetails from './GroupCreateForm';
import GroupChatView from './GroupChatView';
import GroupDetailsWrapper from './groupDetailsWrapper';
import { GroupWelcomePage } from './groupWelcomePage';

const CommunityLayout: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <GroupSidebar
        onSelectGroup={(groupId) => navigate(`/home/community/${groupId}`)}
      />
     
      <div className="flex-1 w-full bg-muted min-w-0 flex flex-col overflow-hidden">
        <Routes>
          <Route path="create" element={<GroupDetails />} />
          <Route path=":communityId/edit" element={<GroupDetailsWrapper />} />
          <Route path=":communityId" element={<CommunityChatWrapper />} />
          <Route
            index
            element={
              <GroupWelcomePage />
            }
          />
        </Routes>
      </div>
    </div>
  );
};


const isValidCommunityId = (id: string | undefined) => {
  return !!id && /^[a-f\d]{24}$/i.test(id); // for MongoDB ObjectId
};

const CommunityChatWrapper: React.FC = () => {
  const { communityId } = useParams();
    const navigate = useNavigate();

  const isValid = isValidCommunityId(communityId);

if (!isValid) {
return <GroupWelcomePage />
}


  return (
    <div className="h-full w-full p-4 flex flex-col min-h-0">
      <div className="flex flex-grow min-h-0 overflow-hidden">
        <div className="w-[300px] shrink-0 overflow-y-auto hidden lg:block">
          <GroupDetailsWrapper />
        </div>
        <div className="flex-grow min-w-0 flex flex-col">
          {/* <GroupChatView communityId={communityId!} /> */}
          {isValid && <GroupChatView communityId={communityId!} />}
        </div>
      </div>
    </div>
  );
};


export default CommunityLayout;