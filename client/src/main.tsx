import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterOrganization from './pages/RegisterOrganization';
import AcceptInvitation from './pages/AcceptInvitation';
import Dashboard from './pages/Dashboard';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LandingPage from './pages/LandingPage';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Check if we're on a subdomain (organization) or main domain
  const isSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    return parts.length > 2 && parts[0] !== 'www';
  };

  const isOrgDomain = isSubdomain();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={RegisterOrganization} />
            <Route path="/accept-invitation" component={AcceptInvitation} />
            <Route path="/super-admin/login" component={SuperAdminLogin} />
            <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/" component={isOrgDomain ? Dashboard : LandingPage} />
            <Route>
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
