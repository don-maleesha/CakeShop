# Setup Instructions for CakeShop Profile Feature

## Issue Resolution

The profile page was failing with 500 errors because the `jsonwebtoken` and `cookie-parser` packages were missing from the API dependencies.

## Steps to Fix:

### 1. Install Missing Dependencies
Navigate to the api directory and install the missing packages:

```bash
cd "C:\xampp\htdocs\CakeShop\api"
npm install jsonwebtoken@^9.0.0 cookie-parser@^1.4.6
```

### 2. Start the API Server
You can start the API server in one of these ways:

**Option A: Using the provided scripts**
- Double-click `start-api.bat` (Windows Batch)
- Or run `start-api.ps1` (PowerShell)

**Option B: Manual command**
```bash
cd "C:\xampp\htdocs\CakeShop\api"
node index.js
```

**Option C: Using npm**
```bash
cd "C:\xampp\htdocs\CakeShop\api"
npm start
```

### 3. Start the Client
In a separate terminal:
```bash
cd "C:\xampp\htdocs\CakeShop\client"
npm run dev
```

## Features Implemented:

### ✅ UserProfile Component
- View and edit user profile information
- Fetch data from database via API
- Update profile with real-time validation
- Display user statistics (orders, spending, etc.)
- Show recent order history
- Responsive design with loading states and error handling

### ✅ API Endpoints Added/Enhanced
- `GET /api/profile` - Fetch user profile with complete data
- `PUT /api/profile` - Update user profile information  
- `GET /api/users/stats` - Get user statistics and order history

### ✅ Database Schema Enhanced
- Added `phone` and `address` fields to User model
- Maintains backward compatibility

### ✅ Frontend Features
- Protected route for profile page
- Fallback to cached data if API unavailable
- Comprehensive error handling and user feedback
- Form validation and success/error messages

## How to Use:

1. Make sure you're logged in
2. Click on your user avatar in the header
3. Select "Profile" from the dropdown
4. View your profile information
5. Click "Edit Profile" to make changes
6. Save your changes

## Troubleshooting:

### If you get "Cannot connect to server" error:
1. Make sure the API server is running on port 4000
2. Check that MongoDB is connected
3. Verify the .env file has correct MongoDB URI

### If profile shows cached data:
- This means the API server is not responding
- Start the API server using the instructions above
- Refresh the profile page

### If you can't save profile changes:
- Make sure you're logged in
- Ensure the API server is running
- Check browser console for detailed error messages
