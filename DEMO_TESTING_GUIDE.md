# 🧪 Demo Testing Guide

Use this guide to test all features of your Sales Management SaaS platform with the demo accounts.

## 🔧 Setup Demo Accounts

### **Step 1: Run Demo Account Setup**
1. Go to your Neon database console
2. Open the SQL Editor
3. Copy and paste the contents of `setup-demo-accounts.sql`
4. Execute the script
5. Verify all accounts are created

## 🔑 Demo Login Accounts

### **1. Super Admin (Platform Administrator)**
- **URL**: `https://yoursite.netlify.app/super-admin/login`
- **Email**: `admin@salesmanagement.com`
- **Password**: `SuperAdmin123!`
- **Role**: Platform administrator with full control

### **2. Organization Admin**
- **URL**: `https://yoursite.netlify.app/login?org=demo-company`
- **Email**: `admin@democompany.com`
- **Password**: `OrgAdmin123!`
- **Role**: Full control over Demo Company organization

### **3. Sales Manager**
- **URL**: `https://yoursite.netlify.app/login?org=demo-company`
- **Email**: `manager@democompany.com`
- **Password**: `Manager123!`
- **Role**: Team management and sales oversight

### **4. Sales Executive**
- **URL**: `https://yoursite.netlify.app/login?org=demo-company`
- **Email**: `sales@democompany.com`
- **Password**: `Sales123!`
- **Role**: Create and manage own sales

## 🧪 Testing Scenarios

### **Scenario 1: Super Admin Testing**

**Login as Super Admin**
1. Go to `/super-admin/login`
2. Login with `admin@salesmanagement.com` / `SuperAdmin123!`

**Test Features:**
- ✅ View organization dashboard
- ✅ See Demo Company in organization list
- ✅ Create new organization
- ✅ Edit organization details
- ✅ View organization users
- ✅ Manage subscription plans
- ✅ View platform analytics

### **Scenario 2: Organization Admin Testing**

**Login as Organization Admin**
1. Go to `/login?org=demo-company`
2. Login with `admin@democompany.com` / `OrgAdmin123!`

**Test Features:**
- ✅ View organization dashboard
- ✅ Manage users (invite, edit, deactivate)
- ✅ Create and manage projects
- ✅ View all sales across the organization
- ✅ Manage departments and roles
- ✅ Set sales targets
- ✅ View reports and analytics
- ✅ Manage organization settings

### **Scenario 3: Sales Manager Testing**

**Login as Sales Manager**
1. Go to `/login?org=demo-company`
2. Login with `manager@democompany.com` / `Manager123!`

**Test Features:**
- ✅ View team dashboard
- ✅ See all team sales
- ✅ Approve site visits
- ✅ Set team targets
- ✅ View team performance
- ✅ Create sales entries
- ✅ Manage team announcements
- ✅ View reports

### **Scenario 4: Sales Executive Testing**

**Login as Sales Executive**
1. Go to `/login?org=demo-company`
2. Login with `sales@democompany.com` / `Sales123!`

**Test Features:**
- ✅ View personal dashboard
- ✅ Create new sales
- ✅ View own sales only
- ✅ Schedule site visits
- ✅ View personal targets
- ✅ Update sales status
- ✅ View announcements

## 📊 Sample Data Available

### **Organization: Demo Company Ltd**
- **Industry**: Real Estate
- **Subscription**: Paid (₹6,000/year)
- **Users**: 4 (Admin, Manager, Executive)
- **Projects**: 3 active projects

### **Projects:**
1. **Green Valley Apartments**
   - Type: Apartment
   - Location: Gurgaon
   - Status: Running

2. **Sunrise Villas**
   - Type: Duplex
   - Location: Noida
   - Status: Running

3. **Commercial Plaza**
   - Type: Land
   - Location: Bangalore
   - Status: Running

### **Sample Sales:**
1. **Rajesh Kumar** - Green Valley Apartments
   - Amount: ₹60,00,000
   - Paid: ₹18,00,000 (30%)
   - Plot: A-101

2. **Priya Sharma** - Sunrise Villas
   - Amount: ₹2,00,00,000
   - Paid: ₹50,00,000 (25%)
   - Plot: V-05

## 🔍 Feature Testing Checklist

### **Multi-Tenancy**
- ✅ Data isolation between organizations
- ✅ Subdomain routing works
- ✅ Organization-specific branding
- ✅ Role-based permissions

### **User Management**
- ✅ User invitation system
- ✅ Role assignment
- ✅ Permission management
- ✅ User activation/deactivation

### **Sales Management**
- ✅ Create sales entries
- ✅ Update payment status
- ✅ Track sales pipeline
- ✅ Generate sales reports

### **Project Management**
- ✅ Create projects
- ✅ Assign sales to projects
- ✅ Track project progress
- ✅ Project-wise analytics

### **Reporting & Analytics**
- ✅ Sales reports
- ✅ User performance
- ✅ Revenue tracking
- ✅ Target vs achievement

### **Security**
- ✅ Secure authentication
- ✅ Session management
- ✅ Data encryption
- ✅ Access control

## 🚨 Common Testing Issues

### **Login Issues**
- Ensure you're using the correct URL for each account type
- Super Admin uses `/super-admin/login`
- Organization users use `/login?org=demo-company`

### **Permission Errors**
- Each role has specific permissions
- Sales Executive can only see own sales
- Manager can see team sales
- Admin can see all organization sales

### **Data Not Showing**
- Ensure demo data was created properly
- Check if you're logged into the correct organization
- Verify the user has permission to view the data

## 📱 Mobile Testing

Test the responsive design:
- ✅ Login on mobile devices
- ✅ Dashboard navigation
- ✅ Sales entry forms
- ✅ Reports viewing

## 🔄 Testing Workflow

### **Complete User Journey**
1. **Super Admin** creates organization
2. **Organization Admin** sets up users and projects
3. **Sales Manager** assigns targets and manages team
4. **Sales Executive** creates sales and manages customers
5. **All roles** view appropriate reports and analytics

### **Multi-User Testing**
1. Open multiple browser windows/incognito tabs
2. Login with different accounts simultaneously
3. Test real-time updates and data isolation
4. Verify permissions work correctly

## 📞 Support During Testing

If you encounter issues:
1. Check browser console for errors
2. Verify database connection
3. Ensure all demo data was created
4. Check Netlify function logs
5. Verify environment variables are set

## 🎯 Success Criteria

Your SaaS platform is working correctly if:
- ✅ All demo accounts can login
- ✅ Data is properly isolated between roles
- ✅ Sales can be created and managed
- ✅ Reports show correct data
- ✅ Multi-tenant features work
- ✅ Responsive design functions properly

## 🚀 Next Steps After Testing

Once testing is complete:
1. Create your real organization
2. Invite actual users
3. Set up real projects
4. Configure payment integration
5. Customize branding
6. Launch to production

Happy testing! 🎉
