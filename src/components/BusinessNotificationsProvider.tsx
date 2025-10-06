import React from 'react';
import { useBusinessNotifications } from '../hooks/useBusinessNotifications';

interface BusinessNotificationsProviderProps {
  children: React.ReactNode;
}

const BusinessNotificationsProvider: React.FC<BusinessNotificationsProviderProps> = ({ children }) => {
  // Initialize business notifications with proper cleanup
  const businessNotifications = useBusinessNotifications();

  return <>{children}</>;
};

export default BusinessNotificationsProvider;