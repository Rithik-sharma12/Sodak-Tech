# Sodak-Tech Admin Panel Guide

## Overview

The Sodak-Tech Admin Panel provides comprehensive management tools for administrators and moderators to manage the entire platform. Full CRUD operations, advanced analytics, system monitoring, and user notification capabilities.

## Access & Security

### Accessing the Admin Panel
- Navigate to `/admin/dashboard`
- Requires admin or moderator role
- Secure session management with role-based access control

### Security Features
- Role-based access control (RBAC)
- Admin activity audit logging
- IP whitelist capability
- 2FA support for admin accounts
- Session timeout protection
- Secure password management

## Admin Dashboard

### Dashboard Overview (`/admin/dashboard`)

The main admin hub with real-time metrics and quick access to key functions.

**Key Metrics:**
- Total Users: System-wide user count
- Active Users: Currently online users
- Total Problems: Available coding problems
- Total Contests: All contests in system

**System Health Status:**
- API Health: Response time, uptime percentage
- Database Health: Connection status, storage usage, query performance
- Error Rate: System-wide error percentage
- Active Requests: Currently processing requests

**Recent Activities:**
- Audit log of recent admin actions
- Problem and user report queue
- System health indicators

## User Management (`/admin/users`)

### Features

**User List Management:**
- View all users with pagination (50 per page)
- Search by name or email
- Filter by role (Admin, Moderator, User)
- Filter by status (Active, Banned, Suspended)
- Sort by any column

**User Actions:**
- **View Details**: See complete user profile
- **Suspend**: Temporarily suspend account (default 7 days)
- **Ban**: Permanently ban user from platform
- **Delete**: Remove user account
- **Reset Password**: Force password reset
- **View Statistics**: User rating and problem history

**Suspension & Banning:**
- Automatic removal from contests
- Notifications sent to affected user
- History tracked in audit logs
- Easy reinstatement process for suspensions

### User Information Displayed
- Display Name & Email
- Rating & Problems Solved
- Account Created Date
- Last Login
- Current Role
- Account Status

## Content Management

### Problems Management (`/admin/problems`)
- Create new problems with full editor
- Edit existing problems
- Delete problems
- Batch import problems
- Set difficulty levels
- Assign categories and tags
- View solve statistics

**Coming Soon:**
- Full CRUD interface with advanced form
- Test case management
- Editorial solution management
- Problem statistics and analytics

### Contests Management (`/admin/contests`)
- Create and schedule contests
- Edit contest details and rules
- Set problem sets
- Manage participant registration
- View real-time participation
- Generate contest reports

**Status Filters:**
- Upcoming: Future contests
- Ongoing: Currently active contests
- Past: Historical contests

### Categories Management (`/admin/categories`)
- Create problem categories
- Organize tags and topics
- Assign difficulty levels
- View problem count per category
- Bulk category operations

## Notification System (`/admin/notifications`)

### Notification Types

**1. Broadcast Notifications**
- Send to all users simultaneously
- System-wide announcements
- Maintenance notifications
- Platform updates
- Example: "System maintenance on Sunday 2AM UTC"

**2. Targeted Notifications**
- Send to specific user groups
- Filter by rating range
- Filter by problems solved count
- Example: "Congratulations on reaching Expert Level! (2000+ rating)"

**3. Individual Notifications**
- Send to specific users
- Personalized messages
- Contest invitations
- Achievement awards

### Notification Composer

**Fields:**
- Title: Notification heading
- Message: Notification body
- Type: Broadcast, Targeted, or Individual
- Recipients: All users or specific selection
- Filters: Rating range, minimum problems solved
- Schedule: Send immediately or schedule for later
- Expiration: Optional expiry date

**Features:**
- Preview before sending
- Schedule for specific date/time
- View delivery statistics
- Track read count and percentage
- Notification history with status

### Notification History
- View all sent notifications
- Filter by status (Draft, Scheduled, Sent, Failed)
- View recipient count and read percentage
- Edit draft or scheduled notifications
- Delete notifications

## Analytics & Reporting (`/admin/analytics`)

### User Analytics
- Total users count
- Active users today/week
- Banned and suspended counts
- Average user rating
- Rating distribution breakdown
- New user trends
- Engagement metrics

### Problem Analytics
- Total problems in system
- Difficulty distribution (Easy/Medium/Hard)
- Average solve rate
- Most solved problems
- Least solved problems
- Recently added problems
- Problem statistics by category

### Contest Analytics
- Total contests
- Upcoming contests
- Average participants per contest
- Contest difficulty distribution
- Contest popularity metrics
- Participation trends

### Export Options
- Export reports to CSV
- Export reports to PDF
- Download raw data
- Generate custom reports

## System Health Monitoring (`/admin/system-health`)

### API Service Status
- Overall status: Healthy/Degraded/Down
- Response time (milliseconds)
- Uptime percentage
- Current uptime status

### Database Status
- Connection status
- Connection time (milliseconds)
- Query performance percentage
- Storage usage (GB)
- Database health indicator

### Server Resources
- **CPU Usage**: Current percentage with visual gauge
- **Memory Usage**: Current percentage with visual gauge
- Active requests count
- Error rate percentage

### Performance Metrics
- Last 24 hours error rate
- System uptime for the month
- Resource utilization trends
- Performance alerts

## Moderation Tools (`/admin/moderation`)

### Report Management

**Report Types:**
- Problem Reports: Content issues with problems
- User Reports: Violations and rule breaches

**Report Status:**
- Pending: Awaiting review
- Reviewed: Under consideration
- Resolved: Action taken
- Dismissed: No action needed

### Problem Reports Queue
- View all pending problem reports
- Reason for report
- Detailed description
- Reporter information
- Report date and time
- Resolve or dismiss reports

### User Reports Queue
- Severity levels: Low, Medium, High
- Report reason and description
- Severity indicators
- Quick action buttons

**Actions:**
- Approve Report: Validate the report
- Take Action: Ban/suspend user if needed
- Dismiss: Close without action
- View Details: Full report information

### Report Statistics
- Total reports pending
- Resolved reports count
- Dismissed reports count
- Monthly report trends
- Most common violation types

## Admin Settings (`/admin/settings`)

### General Settings
- Platform name configuration
- Support email address
- Maximum user limit
- Rate limiting configuration

### Security Settings
- Toggle 2FA requirement for admins
- Enable/disable IP whitelist
- Allow/disallow account deletion
- Enable/disable audit logging
- CSRF protection settings

### Notification Settings
- Send admin alerts (system-wide)
- Email notifications
- SMS alerts (if enabled)
- Alert frequency settings

### Maintenance Mode
- Enable/disable maintenance mode
- Custom maintenance message
- Scheduled maintenance windows
- Maintenance notifications

## API Integration

### Mock API Implementation

All admin endpoints use a mock API layer that can be easily replaced with real backend:

**Location:** `lib/api/admin/`
- `types.ts`: TypeScript interfaces
- `mock.ts`: Mock data and implementation
- `client.ts`: API client wrapper

### Switching to Real Backend

Update `lib/api/admin/client.ts` to call real API endpoints:

```typescript
// Replace mock with real API calls
const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_URL

export const AdminClient = {
  dashboard: {
    get: () => fetch(`${baseURL}/admin/dashboard`).then(r => r.json()),
  },
  users: {
    list: (page, limit) => 
      fetch(`${baseURL}/admin/users?page=${page}&limit=${limit}`)
        .then(r => r.json()),
    // ... etc
  },
}
```

## Data Table Component

### Features
- Sortable columns
- Filterable rows
- Pagination (configurable page size)
- Bulk actions support
- Export data functionality
- Custom cell rendering
- Loading states
- Empty states

### Usage

```typescript
import { DataTable, type Column } from '@/components/admin/data-table'

const columns: Column<T>[] = [
  { key: 'name', label: 'Name', width: '200px' },
  { 
    key: 'status', 
    label: 'Status',
    render: (value) => <span className="badge">{value}</span>
  },
]

<DataTable
  columns={columns}
  data={data}
  loading={loading}
  total={total}
  page={page}
  pageSize={50}
  onPageChange={setPage}
  actions={(row) => <ActionButtons row={row} />}
/>
```

## Navigation

### Admin Sidebar
Quick navigation to all admin sections:
- Dashboard
- Users
- Problems
- Contests
- Categories
- Notifications
- Analytics
- System Health
- Moderation
- Settings

**Admin Badge:** Identifies admin vs regular user in top navigation

## Performance Features

### Optimization Techniques
- Component memoization
- Debounced search (500ms)
- Pagination for large datasets (50 rows default)
- Lazy loading of components
- Dynamic imports for heavy features

### Responsive Design
- Primary design for desktop (1024px+)
- Optimized for tablet viewing
- Mobile-friendly (secondary support)
- Touch-friendly buttons (44px minimum)

## Audit Logging

### What Gets Logged
- Admin login/logout
- User bans and suspensions
- Problem modifications
- Contest schedule changes
- Notification sends
- Report resolutions
- Settings changes

### Audit Log Fields
- Admin ID
- Action performed
- Resource type and ID
- Changes made (before/after)
- Timestamp
- IP address

### Access Audit Logs
Navigate to Moderation > Audit Logs to view all administrative actions.

## Best Practices

### Security
1. Always use 2FA on admin accounts
2. Regularly review audit logs
3. Limit admin access to trusted users
4. Enable IP whitelist for admin access
5. Set strong passwords for admin accounts

### Data Management
1. Backup before bulk operations
2. Test changes on staging first
3. Document significant changes
4. Archive old data regularly
5. Verify data exports before sending

### User Communication
1. Notify users before suspensions
2. Provide clear banning reasons
3. Offer appeal process
4. Schedule maintenance during low activity
5. Send advance notice for platform changes

### Monitoring
1. Check system health daily
2. Monitor error rates
3. Review user reports regularly
4. Track problem solve rates
5. Analyze contest participation

## Troubleshooting

### Common Issues

**Dashboard not loading:**
- Check network connection
- Verify admin privileges
- Clear browser cache
- Try incognito mode

**Data not updating:**
- Refresh the page
- Check API connection
- Verify permissions
- Check server status

**Notifications not sending:**
- Check recipient count
- Verify notification content
- Check system health
- Review error logs

## Future Enhancements

- Advanced analytics dashboards
- Batch user operations
- Content moderation AI
- Automated alerts and reports
- Multi-language support
- Two-factor authentication
- Advanced report filters
- Custom dashboard widgets

## Support

For admin panel issues or feature requests, contact support@sodak-tech.com

---

**Admin Panel Version:** 1.0
**Last Updated:** 2026-07-31
**Status:** Production Ready
