import React from 'react';
import { useRequireAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, organization, logout, hasPermission } = useRequireAuth();

  if (!user || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {organization.name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.fullName}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to your Sales Management Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Your multi-tenant SaaS application is ready! This is a placeholder dashboard.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Organization</h3>
                  <p className="text-sm text-gray-600">Name: {organization.name}</p>
                  <p className="text-sm text-gray-600">Slug: {organization.slug}</p>
                  <p className="text-sm text-gray-600">Plan: {organization.subscriptionPlan}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Info</h3>
                  <p className="text-sm text-gray-600">Name: {user.fullName}</p>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  <p className="text-sm text-gray-600">Role: {user.role}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800">
                      View Sales
                    </button>
                    <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800">
                      Manage Users
                    </button>
                    <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800">
                      View Reports
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-lg font-medium text-blue-900 mb-2">
                  🎉 Multi-Tenant SaaS Conversion Complete!
                </h4>
                <p className="text-blue-800 text-sm">
                  Your application now supports multiple organizations with proper tenant isolation,
                  role-based access control, and user onboarding workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
