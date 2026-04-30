import { useState } from 'react';
import { UserRole } from './lib/supabase';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

export default function App() {
  const [loggedInRole, setLoggedInRole] = useState<UserRole | null>(null);

  if (loggedInRole) {
    return (
      <Dashboard
        role={loggedInRole}
        onLogout={() => {
          window.localStorage.removeItem('currentUserId');
          window.localStorage.removeItem('currentUserRole');
          window.localStorage.removeItem('currentUserPhone');
          window.localStorage.removeItem('currentMerchantRemainingUseCount');
          setLoggedInRole(null);
        }}
      />
    );
  }

  return <LoginPage onLoginSuccess={(role) => setLoggedInRole(role)} />;
}
