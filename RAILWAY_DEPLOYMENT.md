# Railway Deployment Guide for DOS CRM

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository with your DOS CRM code
- Supabase project with your database

## Deployment Steps

### 1. Connect to Railway
1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your DOS CRM repository

### 2. Environment Variables
Set the following environment variables in Railway:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=DOS CRM
VITE_APP_VERSION=1.0.0
BACKUP_EMAIL_USER=your_backup_email
BACKUP_EMAIL_PASS=your_backup_password
```

### 3. Build Configuration
Railway will automatically detect the `railway.json` configuration:
- Build command: `npm ci && npm run build`
- Start command: `npm run preview`
- Port: Automatically assigned by Railway

### 4. Domain Setup
1. After deployment, Railway will provide a default domain
2. You can add a custom domain in the Railway dashboard
3. SSL certificates are automatically managed

### 5. Database Connection
- Ensure your Supabase project allows connections from Railway's IP ranges
- Update RLS policies if needed for production environment

## Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates active
- [ ] Custom domain configured (optional)
- [ ] Monitoring and logging set up

## Troubleshooting
- Check Railway logs for build/runtime errors
- Verify environment variables are set correctly
- Ensure Supabase connection is working
- Check network policies and CORS settings

## Support
For Railway-specific issues, check:
- Railway documentation: https://docs.railway.app
- Railway Discord community
- Railway GitHub issues