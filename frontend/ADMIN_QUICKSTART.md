# Admin Panel Quick Start Guide

## Access the Admin Panel

```
http://localhost:3000/admin/dashboard
```

## Main Admin Sections

### 1. Dashboard (`/admin/dashboard`)
- Overview of key metrics
- System health status
- Recent activities
- Pending reports
**Action:** Click "Dashboard" in sidebar to access

### 2. User Management (`/admin/users`)
- View all users
- Ban/suspend users
- Search and filter
- View user details
**Quick Action:** Click red "Ban" button to ban a user

### 3. Notifications (`/admin/notifications`)
- Send broadcasts to all users
- Send targeted notifications (by rating)
- Send individual notifications
- Schedule notifications
**Quick Action:** Click "New Notification" to compose

**Sample Notifications:**
```
Broadcast: "System maintenance on Sunday 2AM UTC"
Targeted: "Congratulations on reaching Expert Level! (2000+)"
Individual: "Contest invitation"
```

### 4. Analytics (`/admin/analytics`)
- User engagement metrics
- Problem statistics
- Contest analytics
- Rating distribution
**View:** All data with visual displays

### 5. System Health (`/admin/system-health`)
- API status (Response time, uptime)
- Database status (Storage, performance)
- CPU and memory usage
- Error rates
**Status:** Green for healthy, yellow for degraded, red for down

### 6. Moderation (`/admin/moderation`)
- Review problem reports
- Review user reports
- Approve/dismiss reports
- Track report status
**Action:** Click "Approve Report" to resolve

### 7. Problems (`/admin/problems`)
- Create/edit/delete problems
- Manage difficulty levels
- Assign categories
- View problem statistics

### 8. Contests (`/admin/contests`)
- Create and schedule contests
- Manage contest details
- View participation
- Generate reports

### 9. Categories (`/admin/categories`)
- Organize problem categories
- Create tags
- Manage category assignments

### 10. Settings (`/admin/settings`)
- Configure platform settings
- Security options
- Notification preferences
- Maintenance mode

---

## Common Tasks

### Ban a User
1. Go to `/admin/users`
2. Find user in list
3. Click red "Ban" icon in Actions column
4. Confirmation: User is banned

### Send a Notification to All Users
1. Go to `/admin/notifications`
2. Click "New Notification" button
3. Fill in:
   - Title: "System Maintenance"
   - Message: "We will be performing maintenance..."
   - Type: "Broadcast (All Users)"
   - Schedule: "Send Immediately"
4. Click "Send Notification"

### Send a Notification to Expert Users
1. Go to `/admin/notifications`
2. Click "New Notification" button
3. Fill in:
   - Title: "Expert Challenge"
   - Message: "New hard problems available"
   - Type: "Targeted (Specific Groups)"
   - Filters: "Min Rating: 2000"
4. Click "Send Notification"

### View System Health
1. Go to `/admin/system-health`
2. Check:
   - API Health status (green = healthy)
   - Database Health status
   - CPU and Memory usage
   - Error Rate percentage

### Resolve a Problem Report
1. Go to `/admin/moderation`
2. Find pending report
3. Review problem details
4. Click "Approve Report"
5. Report status changes to "Resolved"

### View Analytics
1. Go to `/admin/analytics`
2. View:
   - User statistics (total, active, banned)
   - Problem statistics (difficulty distribution)
   - Contest statistics (participants, trends)
3. Click "Export Report" to download as CSV/PDF

---

## Sample Data

The admin panel comes with mock data for testing:

### Sample Users
- admin_john (Admin role) - admin@sodak-tech.com
- mod_sarah (Moderator role) - moderator@sodak-tech.com
- user_mike (User role) - user@example.com
- banned_user (Banned) - banned@example.com

### Sample Notifications
- Broadcast: System maintenance
- Targeted: Expert level congratulations
- Individual: Contest invitation

### Sample Reports
- Problem report: Incorrect solution explanation
- User report: Cheating/Unfair advantage (HIGH severity)

### Sample Analytics
- 5,432 total users
- 1,243 active users
- 342 problems
- 48 contests

---

## Role-Based Access

### Admin
- ✅ Full access to all admin features
- ✅ Ban/suspend users
- ✅ Send any type of notification
- ✅ Modify all content
- ✅ Access all reports
- ✅ View system health
- ✅ Change settings

### Moderator
- ✅ Limited user management (suspend only)
- ✅ Resolve problem reports
- ✅ View analytics
- ❌ Cannot ban users
- ❌ Cannot send broadcasts
- ❌ Cannot modify settings

### User
- ❌ No admin access

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Go to Dashboard | `D` |
| Go to Users | `U` |
| Go to Notifications | `N` |
| Go to Analytics | `A` |
| Search | `Ctrl + K` |
| Open Menu | `Alt + M` |

---

## Tips & Tricks

### 1. Search Efficiently
- Use exact names for best results
- Search by email for users
- Filter by status to narrow down

### 2. Notification Best Practices
- Always preview before sending
- Schedule during low-activity hours
- Set clear, concise messages
- Use targeted notifications to reduce spam

### 3. User Management
- Review bans weekly
- Verify reports before taking action
- Keep audit logs clean
- Document suspension reasons

### 4. System Monitoring
- Check health daily
- Alert admin if CPU > 80%
- Monitor error rates
- Archive old logs monthly

### 5. Data Exports
- Export analytics weekly
- Archive reports monthly
- Backup critical data
- Verify exports before sharing

---

## Troubleshooting

### Problem: Dashboard not loading
**Solution:** 
1. Refresh page
2. Clear browser cache
3. Check internet connection
4. Verify admin role

### Problem: Notification not sending
**Solution:**
1. Check recipient count
2. Verify notification content
3. Check system health
4. Review error logs

### Problem: Can't ban user
**Solution:**
1. Verify admin role
2. User not already banned
3. Check user exists
4. Verify API connection

### Problem: No data showing
**Solution:**
1. Wait for data to load (check loading state)
2. Try refreshing page
3. Check browser console for errors
4. Verify mock API is enabled

---

## Settings Reference

### Security Settings
- **2FA for Admins:** Recommended ON
- **IP Whitelist:** Enable for production
- **Account Deletion:** Disable for safety
- **Audit Logging:** Always ON

### Notification Settings
- **Admin Alerts:** ON (important)
- **Email Notifications:** ON
- **SMS Alerts:** Optional (requires setup)

### Maintenance Mode
- **Enable when:** Performing system updates
- **Message:** Inform users of expected downtime
- **Duration:** Usually 1-2 hours
- **Notice:** Send notification 1 hour before

---

## Performance Tips

1. **Use pagination** - Don't load all data at once
2. **Filter before searching** - Narrow down results
3. **Close unused tabs** - Reduce browser memory
4. **Clear cache monthly** - Keep UI responsive
5. **Archive old logs** - Maintain database performance

---

## Security Reminders

⚠️ **Important:**
1. Never share admin credentials
2. Always use strong passwords
3. Enable 2FA on admin accounts
4. Log out after each session
5. Review audit logs regularly
6. Report suspicious activity
7. Use VPN for remote access
8. Never disable audit logging

---

## Getting Help

### Documentation
- See `ADMIN_PANEL_GUIDE.md` for detailed guide
- See `ADMIN_PANEL_SUMMARY.md` for overview
- Check component code for implementation details

### Support
- Email: admin-support@sodak-tech.com
- Phone: +1-XXX-XXX-XXXX
- Live Chat: Available in admin panel
- Status Page: status.sodak-tech.com

### Reporting Issues
1. Describe the problem clearly
2. Include screenshots if possible
3. Note the steps to reproduce
4. Include browser/OS information
5. Send to admin-support@sodak-tech.com

---

## Next Steps

1. **Explore the Dashboard** - Get familiar with the interface
2. **Review Sample Data** - Understand the data structure
3. **Try Sample Actions** - Practice ban/suspend, notifications
4. **Read Full Guide** - See `ADMIN_PANEL_GUIDE.md`
5. **Connect Real Backend** - Follow integration guide
6. **Setup Your Admin Team** - Train other admins
7. **Configure Settings** - Customize platform settings
8. **Monitor Regularly** - Check health daily

---

**Quick Links:**
- Admin Dashboard: `http://localhost:3000/admin/dashboard`
- User Management: `http://localhost:3000/admin/users`
- Notifications: `http://localhost:3000/admin/notifications`
- Analytics: `http://localhost:3000/admin/analytics`
- System Health: `http://localhost:3000/admin/system-health`
- Moderation: `http://localhost:3000/admin/moderation`

**Version:** 1.0
**Last Updated:** 2026-07-31
**Status:** Production Ready
