# Smart Room IOT

This repository contains the complete Smart Room IOT project, including the mobile app (Vite/React), the backend server (Node.js/Express), the ESP firmware, and the SmartAssistant codebase.

## GitHub Compatibility
The project is now fully GitHub compatible. A comprehensive `.gitignore` file has been added to the root directory. This ensures that sensitive files, such as `firebase-key.json`, `.env` files, and `SmartAssistant/secrets.h`, are **never** committed to version control. Build directories like `node_modules` and `dist` are also ignored to keep the repository clean.

**To push to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Vercel Compatibility (Frontend Deployment)
The `mobile` frontend is configured for deployment on Vercel. It is built using Vite and React, and a `vercel.json` file is present in the `mobile` directory to seamlessly handle Single Page Application (SPA) routing.

**To deploy to Vercel:**
1. Connect your Vercel account to your GitHub repository.
2. In Vercel, click **Import Project**.
3. **Important:** In the **Root Directory** setting, click `Edit` and select the `mobile` folder.
4. Vercel will automatically detect the Vite framework and configure the build settings.
5. Click **Deploy**.

## Backend Deployment Notes
Please note that Vercel is designed for serverless architectures (stateless functions). Because the `backend` uses persistent websockets, a constant heartbeat loop, and intervals for device communication, it **should not** be deployed on Vercel.

To deploy the backend, it is recommended to use a Virtual Private Server (VPS) such as DigitalOcean, AWS EC2, Render (Background Worker / Web Service), or Railway where the Node.js process can run continuously.
