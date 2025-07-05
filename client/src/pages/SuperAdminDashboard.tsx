import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationRegistrationSchema, OrganizationRegistration } from '@shared/schema';
import { TenantUtils } from '@shared/tenant-utils';

export default function SuperAdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrganizationRegistration>({
    resolver: zodResolver(organizationRegistrationSchema),
  });

  const companyName = watch('companyName');

  // Auto-generate slug from company name
  React.useEffect(() => {
    if (companyName) {
      const slug = TenantUtils.generateSlug(companyName);
      setValue('slug', slug);
    }
  }, [companyName, setValue]);

  // Load organizations
  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  React.useEffect(() => {
    loadOrganizations();
  }, []);

  const onSubmit = async (data: OrganizationRegistration) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/organizations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create organization');
      }

      setSuccess(`Organization "${data.companyName}" created successfully!`);
      reset();
      setShowCreateForm(false);
      loadOrganizations(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/super-admin/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Super Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary"
              >
                {showCreateForm ? 'Cancel' : 'Add Organization'}
              </button>
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
          
          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert-success mb-6">
              {success}
            </div>
          )}

          {/* Create Organization Form */}
          {showCreateForm && (
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">
                  Create New Organization
                </h2>
                <p className="text-sm text-gray-600">
                  Add a new client organization to the platform
                </p>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Company Name *</label>
                      <input
                        {...register('companyName')}
                        type="text"
                        className="form-input"
                        placeholder="ABC Real Estate Pvt Ltd"
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Organization URL *</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          {...register('slug')}
                          type="text"
                          className="flex-1 form-input rounded-r-none"
                          placeholder="abc-real-estate"
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          .yourdomain.com
                        </span>
                      </div>
                      {errors.slug && (
                        <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="form-label">Address *</label>
                      <textarea
                        {...register('address')}
                        rows={3}
                        className="form-input"
                        placeholder="Complete company address"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">GST Number</label>
                      <input
                        {...register('gstNumber')}
                        type="text"
                        className="form-input"
                        placeholder="22AAAAA0000A1Z5 (if available)"
                      />
                    </div>

                    <div>
                      <label className="form-label">Industry</label>
                      <select {...register('industry')} className="form-input">
                        <option value="">Select Industry</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Retail">Retail</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Super Admin Name *</label>
                      <input
                        {...register('superAdminName')}
                        type="text"
                        className="form-input"
                        placeholder="John Doe"
                      />
                      {errors.superAdminName && (
                        <p className="mt-1 text-sm text-red-600">{errors.superAdminName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Super Admin Email *</label>
                      <input
                        {...register('superAdminEmail')}
                        type="email"
                        className="form-input"
                        placeholder="admin@company.com"
                      />
                      {errors.superAdminEmail && (
                        <p className="mt-1 text-sm text-red-600">{errors.superAdminEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Super Admin Mobile *</label>
                      <input
                        {...register('superAdminMobile')}
                        type="tel"
                        className="form-input"
                        placeholder="+91 9876543210"
                      />
                      {errors.superAdminMobile && (
                        <p className="mt-1 text-sm text-red-600">{errors.superAdminMobile.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Super Admin Password *</label>
                      <input
                        {...register('superAdminPassword')}
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                      />
                      {errors.superAdminPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.superAdminPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Subscription Start Date</label>
                      <input
                        {...register('subscriptionStartDate')}
                        type="date"
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">Subscription End Date</label>
                      <input
                        {...register('subscriptionEndDate')}
                        type="date"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? 'Creating...' : 'Create Organization'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Organizations List */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">
                Organizations ({organizations.length})
              </h2>
              <p className="text-sm text-gray-600">
                Manage all client organizations on the platform
              </p>
            </div>
            <div className="card-body">
              {organizations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No organizations found</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 btn-primary"
                  >
                    Create First Organization
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {organizations.map((org) => (
                        <tr key={org.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{org.name}</div>
                              <div className="text-sm text-gray-500">{org.slug}.yourdomain.com</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{org.email}</div>
                              <div className="text-sm text-gray-500">{org.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">₹{org.subscriptionAmount}/year</div>
                              <div className="text-sm text-gray-500">{org.subscriptionPlan}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              org.subscriptionStatus === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {org.subscriptionStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a
                              href={`https://${org.slug}.yourdomain.com`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Visit
                            </a>
                            <button className="text-gray-600 hover:text-gray-900">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
