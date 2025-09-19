# Demo Credentials for Ecom Ecosystem

## Quick Start

To test the Ecom Ecosystem application, use these demo credentials:

**Email:** `demo@ecompilot.com`  
**Password:** `demo123`

## How to Access

1. Navigate to the login page: http://localhost:5173/login
2. You'll see a blue demo credentials box with the test credentials
3. Enter the email and password provided above
4. Click "Sign In" to access the application

## Demo Account Features

✅ **Full Admin Access** - Complete access to all application features  
✅ **User Management** - Access to admin panel and user management  
✅ **All Dashboard Features** - Analytics, orders, products, customers  
✅ **Demo Mode Indicator** - Blue "Demo" badge visible in the sidebar  
✅ **No Supabase Required** - Works without backend authentication setup  

## What You Can Test

- **Dashboard Analytics** - View sales metrics and charts
- **Order Management** - Browse and manage orders
- **Product Catalog** - View and manage products
- **Customer Management** - Access customer data
- **User Administration** - Admin-only user management features
- **Theme Switching** - Light/dark mode toggle
- **Responsive Design** - Mobile and desktop layouts
- **Navigation** - All menu items and routing

## Demo Mode Indicators

- **Login Page**: Blue demo credentials box with test account info
- **Sidebar**: Blue "Demo" badge next to user role
- **User Session**: Persistent demo session across page refreshes

## Technical Details

- **Authentication**: Bypasses Supabase for demo user
- **Session Management**: Uses localStorage for demo mode persistence
- **Role**: Admin level access with full permissions
- **Data**: Uses mock data for demonstration purposes

## Limitations

- Demo account cannot change password
- Data changes are not persisted (mock data only)
- Some features may show placeholder content
- Demo session resets when localStorage is cleared

## For Developers

The demo mode is implemented in:
- `src/components/AuthProvider.tsx` - Demo authentication logic
- `src/pages/Login.tsx` - Demo credentials display
- `src/components/Layout.tsx` - Demo mode indicator

To disable demo mode, remove the demo credentials check in the AuthProvider component.

---

**Ready to test?** Visit http://localhost:5173/login and use the demo credentials above!