import { Route, Navigate, Outlet } from 'react-router-dom';
import AdminLayout from '@/ customComponents/adminDashbord/AdminLayout';
import Main from '@/ customComponents/adminDashbord/main/Main';
import SubscriptionManagement from '@/ customComponents/adminDashbord/adminManagement/AdminManagement';
import Spam from '@/ customComponents/adminDashbord/spamManagement/Spam';
import UsersManagement from '@/ customComponents/adminDashbord/usersManagemen/UsersManagemen';
import RoleManagement from '@/ customComponents/adminDashbord/adminManagement/RoleManagement';
import { useAuthStore } from '@/appStore/AuthStore';
import type { IPermissions } from '@/types/adminTypes'; 
import { useModalStore } from '@/appStore/modalStore';
import { useEffect } from 'react';


const ProtectedAdminRoute = () => {
  const { admin } = useAuthStore();
  console.log(admin, 'admin');
  const isAuthenticated = useAuthStore((s) => s.isAdminAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};


const PermissionRoute = ({
  permissionKey,
  element,
}: {
  permissionKey: keyof IPermissions;
  element: JSX.Element;
}) => {
  const hasPermission = useAuthStore((s) => s.getAdminPermissions()[permissionKey]);
  console.log(hasPermission, 'hasPermission');
  const { showModal } = useModalStore();

  useEffect(() => {
    if (!hasPermission) {
      showModal(`You do not have permission to access "${permissionKey}"`);
    }
  }, [hasPermission, permissionKey, showModal]);

  return hasPermission ? element : <Navigate to="/admin/dashboard" replace />;
};

// ✅ Main Admin Routes Function
const AdminRoutes = () => [
  <Route key="admin-root" path="/admin" element={<ProtectedAdminRoute />}>
    <Route element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Main />} />

      <Route
        path="subscriptions"
        element={
          <PermissionRoute permissionKey="subscription" element={<SubscriptionManagement />} />
        }
      />
      <Route path="spam" element={<PermissionRoute permissionKey="spam" element={<Spam />} />} />
      <Route
        path="users"
        element={<PermissionRoute permissionKey="users" element={<UsersManagement />} />}
      />
      <Route
        path="roles"
        element={<PermissionRoute permissionKey="roleManagement" element={<RoleManagement />} />}
      />
    </Route>
  </Route>,
];

export default AdminRoutes;
