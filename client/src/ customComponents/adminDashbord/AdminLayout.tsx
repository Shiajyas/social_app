import Sidebar from './sidebar/Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import PermissionDeniedModal from '../common/PermissionDeniedModal';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4">
          <PermissionDeniedModal />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
