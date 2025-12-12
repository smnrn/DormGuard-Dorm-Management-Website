# 🏠 DormGuard - Visitor Management System

**Version 2.2** | Production Ready ✅

A comprehensive dormitory security system with digital visitor registration, role-based authentication, real-time tracking, email notifications, and Google Drive integration.

---

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo>
cd dormguard
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 📚 Essential Documentation

### Quick Links

| Document | Description | Priority |
|----------|-------------|----------|
| **[START_HERE.md](./START_HERE.md)** | Main navigation hub | 🔴 Start here |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Installation & configuration | 🔴 Required |
| **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** | Technical architecture | 🟡 Developers |
| **[API_DOCUMENTATION_README.md](./API_DOCUMENTATION_README.md)** | Complete API reference | 🟡 API Testing |
| **[POSTMAN_API_DOCUMENTATION.md](./POSTMAN_API_DOCUMENTATION.md)** | Postman testing guide | 🟡 API Testing |
| **[FINAL_PROJECT_PRESENTATION.md](./FINAL_PROJECT_PRESENTATION.md)** | Presentation guide | 🟢 Students |
| **[FINAL_FIX_SUMMARY.md](./FINAL_FIX_SUMMARY.md)** | Recent bug fixes | 🟢 Reference |
| **[COMPLETE_DATABASE_SETUP.sql](./COMPLETE_DATABASE_SETUP.sql)** | Database schema | 🔴 Required |

---

## ✨ Key Features

### Core Features
- ✅ **Role-based authentication** (Tenant, Admin, Help Desk)
- ✅ **Digital visitor registration** with 12-hour advance requirement
- ✅ **Real-time visitor approvals/rejections** with email notifications
- ✅ **Digital pass generation** with QR codes
- ✅ **6-step tenant registration** capturing 35+ fields
- ✅ **Room & tenant management** with search/filter
- ✅ **Analytics dashboard** with real-time statistics
- ✅ **Visit history & logs** for audit trails

### Advanced Features
- 📧 **Email Notifications** - Beautiful HTML emails for visitor approvals/rejections
- 📁 **Google Drive Storage** - Cloud storage for profile images (99.98% database savings)
- 🔐 **Password Management** - Change password with real-time database sync
- 🔔 **Real-time Notifications** - Notification badge with dropdown center
- ⚡ **Real-time Sync** - 5-second polling for live updates
- 🎨 **Motion Animations** - Smooth professional animations throughout
- 🛡️ **Error Boundaries** - Graceful error handling on all pages

---

## ⚙️ Configuration

### Required (Backend)
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dormguard

# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

### Optional Features

#### Gmail Notifications
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # See SETUP_GUIDE.md
EMAIL_FROM=DormGuard <your-email@gmail.com>
```

#### Google Drive Storage
```bash
VITE_USE_GOOGLE_DRIVE=true
VITE_GOOGLE_DRIVE_API_KEY=your-api-key
VITE_GOOGLE_DRIVE_CLIENT_ID=your-client-id
VITE_GOOGLE_DRIVE_FOLDER_ID=your-folder-id  # Optional
```

---

## 🗄️ Database Setup

### Quick Setup (Recommended)

**One file, one command!** Just run:

```bash
psql -U your_username -d dormguard < COMPLETE_DATABASE_SETUP.sql
```

This single file includes:
- ✅ All tables (Rooms, Admin, Tenant, Visitor, Visitor_Log, Password_Change_Log)
- ✅ All indexes for performance
- ✅ All triggers and views
- ✅ Sample production users
- ✅ 30 empty rooms ready to use
- ✅ Email notification support
- ✅ Google Drive integration support

### Manual Setup (Alternative)

If you prefer step-by-step:

1. **Create Database**
   ```sql
   CREATE DATABASE dormguard;
   ```

2. **Run Setup File**
   ```bash
   psql -U your_username -d dormguard < COMPLETE_DATABASE_SETUP.sql
   ```

3. **Verify Setup**
   - Check that all tables exist
   - Login with default credentials (see below)

### Default Credentials
- **Admin:** `simon.roaring` / `admin123`
- **Help Desk:** `kenrick.cham` / `admin123`
- ⚠️ **Change these passwords after first login!**

---

## 📦 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS v4.0
- Motion/React (animations)
- Vite (build tool)

**Backend:**
- Node.js + Express
- MySQL/PostgreSQL
- JWT Authentication
- Nodemailer (emails)

**Optional Integrations:**
- Google Drive API (file storage)
- Gmail SMTP (notifications)

---

## 🎯 User Roles

### 👤 Tenant
- Pre-register visitors
- View visitor history
- Update profile
- Change password
- Receive email notifications

### 👨‍💼 Admin
- Approve/reject visitor requests
- Manage tenants
- Manage rooms
- View analytics
- Register new tenants

### 🆘 Help Desk
- View visitor approvals
- Assist with visitor check-in
- Generate digital passes

---

## 📊 Project Structure

```
dormguard/
├── src/
│   ├── components/       # React components
│   │   ├── tenant/      # Tenant-specific
│   │   ├── admin-new/   # Admin-specific
│   │   └── ui/          # Reusable UI
│   ├── lib/             # Utilities
│   ├── utils/           # Helper functions
│   └── styles/          # Global CSS
├── docs/                # Documentation
├── public/              # Static assets
└── backend/             # Node.js server (separate repo/folder)
```

---

## 🔧 Development

### Run Frontend
```bash
npm run dev
```

### Run Backend
```bash
cd backend
npm start
```

### Build for Production
```bash
npm run build
```

---

## 🚀 Deployment

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)
3. Set environment variables

### Backend
1. Deploy to server (Heroku, DigitalOcean, etc.)
2. Set environment variables
3. Run database migrations
4. Start server

### Checklist
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Gmail app password created (if using emails)
- [ ] Google Drive API configured (if using Drive)
- [ ] SSL/HTTPS enabled
- [ ] Test all features
- [ ] Monitor logs

---

## 📧 Email Notifications

Sends beautiful HTML emails for:
- ✅ Visitor approval
- ❌ Visitor rejection

**Setup time:** 5 minutes  
**See:** [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Gmail Notifications section

---

## 📁 Google Drive Storage

**Benefits:**
- 99.98% smaller database
- 3-6x faster page loads
- Support up to 5MB images (vs 2MB)
- Free 15GB storage
- Automatic CDN delivery

**Setup time:** 30 minutes  
**See:** [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Google Drive section

**Fallback:** Automatically uses base64 if not configured

---

## 🧪 Testing

### Manual Testing
```bash
# Run dev server
npm run dev

# Test features:
# 1. Login as different roles
# 2. Create/approve visitors
# 3. Upload profile image
# 4. Change password
# 5. Search tenants
```

### API Testing
```bash
# Test backend endpoints
curl http://localhost:5000/api/health
```

---

## 🐛 Troubleshooting

### Gmail not sending emails?
- Check app password (not regular password)
- Verify 2FA is enabled
- Check spam folder
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section

### Google Drive not working?
- Verify API key and Client ID
- Check authorized origins
- Allow browser popups
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section

### Environment variables not loading?
- Restart dev server after changes
- Check `.env` file location (project root)
- Verify variable names (`VITE_` prefix for frontend)

---

## 📈 Performance

**Database Savings (1,000 users):**
- Without Drive: 668MB
- With Drive: 98KB
- Savings: 99.98%

**Page Load (20 images):**
- Without Drive: 2-3 seconds
- With Drive: 0.5-1 second
- Improvement: 3-6x faster

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Input validation & sanitization
- ✅ CORS protection
- ✅ Environment variables for secrets
- ✅ OAuth 2.0 (Google Drive)
- ✅ Gmail app passwords

**Never commit:**
- `.env` files
- API keys
- Passwords
- JWT secrets

---

## 📝 License

[Your License Here]

---

## 👥 Contributors

[Your Team Here]

---

## 🙏 Acknowledgments

- React Team
- Tailwind CSS
- Google Drive API
- Nodemailer

---

## 📞 Support

- **Documentation:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Issues:** [GitHub Issues](#)
- **Email:** [your-support-email]

---

## 🔄 Version History

### v2.2 (Current)
- ✅ Inline password change in profile
- ✅ Google Drive integration
- ✅ Email notifications
- ✅ Enhanced search

### v2.1
- Profile image upload
- Notification system
- Analytics dashboard

### v2.0
- Supabase migration
- Role consolidation
- UI improvements

### v1.0
- Initial release
- Core visitor management

---

**Last Updated:** November 29, 2024  
**Status:** Production Ready ✅  
**DormGuard v2.2** - Secure. Efficient. Professional.