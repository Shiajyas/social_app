import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscriptionStore } from '@/appStore/useSubscriptionStore';

interface Props {
  children: React.ReactNode;
}

const ProUserPrivateRoute: React.FC<Props> = ({ children }) => {
  const {isSubscribed} = useSubscriptionStore()

  return isSubscribed? <>{children}</> : <Navigate to="/home" replace />;
};

export default ProUserPrivateRoute;
