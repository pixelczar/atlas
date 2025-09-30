# Atlas - Deployment Guide

## 🚀 Vercel Deployment (Recommended)

Atlas is optimized for deployment on Vercel, the creators of Next.js.

### Prerequisites
- GitHub account
- Vercel account ([sign up free](https://vercel.com/signup))
- Firebase project configured

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/atlas.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   
   In Vercel project settings, add these variables:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live site!

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## 🔥 Firebase Configuration

### Update Firebase Console

After deploying, update your Firebase project:

1. **Authentication → Authorized Domains**
   - Add your Vercel domain: `your-app.vercel.app`
   - Add any custom domains

2. **Firestore → Rules**
   
   Update security rules for production:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /projects/{projectId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
           request.auth.uid == resource.data.ownerId;
       }
       match /nodes/{nodeId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /edges/{edgeId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

3. **Storage → Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /projects/{projectId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

## 🌐 Custom Domain

### Add Custom Domain to Vercel

1. Go to your project in Vercel
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions

### Update Firebase

1. Add custom domain to Firebase Authentication → Authorized Domains
2. Update CORS settings if needed

## 📊 Environment Variables

### Required Variables

All Firebase configuration variables must be set:

```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Setting Variables in Vercel

**Via Dashboard:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select environment (Production, Preview, Development)

**Via CLI:**
```bash
vercel env add VARIABLE_NAME production
```

## 🔒 Security Checklist

- [ ] Firebase Security Rules updated for production
- [ ] Storage Rules configured properly
- [ ] Environment variables set in Vercel
- [ ] Authorized domains configured in Firebase
- [ ] CORS configured if using custom domain
- [ ] API keys restricted (Firebase Console → Credentials)
- [ ] Rate limiting considered for public endpoints

## 🚦 Continuous Deployment

With GitHub integration:
- Push to `main` → Deploy to production
- Push to other branches → Deploy to preview
- Pull requests → Deploy preview automatically

### Branch Deployments

Configure in `vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "preview": true
    }
  }
}
```

## 📈 Monitoring

### Vercel Analytics

1. Enable Analytics in Vercel dashboard
2. View real-time performance metrics
3. Monitor Web Vitals

### Firebase Monitoring

1. **Firestore Usage**
   - Monitor read/write operations
   - Check quota usage

2. **Storage Usage**
   - Track storage size
   - Monitor bandwidth

3. **Authentication**
   - Track user signups
   - Monitor auth errors

## 🐛 Troubleshooting

### Build Fails

**Check build logs:**
```bash
vercel logs
```

**Common issues:**
- Missing environment variables
- TypeScript errors
- Dependency issues

**Solutions:**
```bash
# Rebuild locally
npm run build

# Check environment variables
vercel env ls

# Clear cache and redeploy
vercel --force
```

### Firebase Connection Issues

**Authorized domains:**
- Verify domain in Firebase Console → Authentication → Settings

**CORS errors:**
- Check Storage rules
- Verify domain configuration

### Performance Issues

**Enable caching:**
- Configure in `next.config.ts`
- Use Vercel Edge Caching

**Optimize images:**
- Use Next.js Image component
- Enable image optimization in Vercel

## 🔄 Rollback

### Vercel Rollback

1. Go to Deployments in Vercel
2. Find previous working deployment
3. Click "Promote to Production"

### CLI Rollback

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote [deployment-url]
```

## 📝 Deployment Checklist

- [ ] Build passes locally (`npm run build`)
- [ ] Environment variables configured
- [ ] Firebase rules updated
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled
- [ ] Monitoring set up
- [ ] Security rules verified
- [ ] Backup plan established

## 🎉 Post-Deployment

1. **Test Production**
   - Verify all features work
   - Test authentication
   - Check Firebase connections

2. **Monitor**
   - Watch initial traffic
   - Check error logs
   - Monitor performance

3. **Optimize**
   - Review Web Vitals
   - Optimize images
   - Configure caching

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
