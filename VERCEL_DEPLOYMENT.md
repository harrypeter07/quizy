# Vercel Deployment Guide

## Prerequisites

1. **MongoDB Database**: You need a MongoDB database (MongoDB Atlas recommended)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Deployment Steps

### 1. Connect Your Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository and click "Deploy"

### 2. Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following environment variables:

#### Required Environment Variables:

```env
ADMIN_TOKEN=your-secret-admin-token-123
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

#### Environment Variable Details:

- **ADMIN_TOKEN**: A secret token for admin authentication (can be any secure string)
- **MONGODB_URI**: Your MongoDB connection string

### 3. MongoDB Setup

1. **Create MongoDB Atlas Account** (if you don't have one):
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster

2. **Get Connection String**:
   - In MongoDB Atlas, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with your database name

3. **Set up Database**:
   - The app will automatically create the required collections
   - Or use the admin panel to set up the database

### 4. Deploy

1. After setting environment variables, Vercel will automatically redeploy
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## Post-Deployment Setup

### 1. Access Admin Panel

1. Go to `https://your-project.vercel.app/admin`
2. Enter your admin token (the one you set in ADMIN_TOKEN)
3. Click "Login"

### 2. Set Up Database (Optional)

1. In the admin panel, go to the "Dashboard" tab
2. If needed, use the database setup features

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **Missing Dependencies**: Ensure all dependencies are in `package.json`
2. **Environment Variables**: Verify all required environment variables are set
3. **MongoDB Connection**: Check your MongoDB URI is correct

### Runtime Errors

1. **Database Connection**: Verify MongoDB URI and network access
2. **Admin Authentication**: Check ADMIN_TOKEN is set correctly
3. **CORS Issues**: Vercel handles CORS automatically

## Security Notes

1. **Admin Token**: Use a strong, unique token for production
2. **MongoDB**: Enable IP whitelist in MongoDB Atlas for production
3. **Environment Variables**: Never commit sensitive data to your repository

## Support

If you encounter issues:

1. Check the Vercel build logs
2. Verify environment variables are set correctly
3. Test MongoDB connection locally first
4. Check the browser console for client-side errors 