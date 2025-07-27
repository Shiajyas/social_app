import { Route } from 'react-router-dom';
import HomeLayout from '@/pages/User/Home';
import PostList from '@/ customComponents/home/post/PostList';
import PostDetails from '@/ customComponents/home/post/PostDetails';
import Notification from '@/ customComponents/home/Notification';
import ProfilePage from '@/ customComponents/home/profile/ProfilePage';
import PostUpload from '@/ customComponents/home/post/postUploadComponent';
import EditPost from '@/ customComponents/home/post/EditPost';
import ChatSection from '@/ customComponents/home/chat/ChatSection';
import UserPrivateRoute from './UserPrivateRoute';
import { SearchSection } from '@/ customComponents/home/search/SearchSection';
import { HashtagSearchResults } from '@/ customComponents/home/search/HashtagSearchResults';

const UserRoutes = () => (
  <Route
    path="/home/*"
    element={
      <UserPrivateRoute>
        <HomeLayout />
      </UserPrivateRoute>
    }
  >
    <Route index element={<PostList />} />
    <Route path="post/:postId" element={<PostDetails />} />
    <Route path="notifications" element={<Notification />} />
    <Route path="profile/:userId" element={<ProfilePage />} />
    <Route path="create/:userId" element={<PostUpload />} />
    <Route path="edit-post/:postId" element={<EditPost />} />
    <Route path="messages" element={<ChatSection />} />
    <Route path="search" element={<SearchSection />} />
    <Route path="search/hashtag/:tag" element={<HashtagSearchResults />} />

  </Route>
);

export default UserRoutes;
