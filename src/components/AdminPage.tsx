import { useState } from 'react';
import { Shield, UserPlus, Clock, UserCog, Users, UserCheck, FileText, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { UserData } from '../App';
import { AdminVisitorApprovals } from './admin-new/AdminVisitorApprovals';
import { AdminTenantManagement } from './admin-new/AdminTenantManagement';
import { AdminRegisterTenantComprehensive } from './admin-new/AdminRegisterTenantComprehensive';
import { AdminExpectedVisitors } from './admin-new/AdminExpectedVisitors';
import { AdminActiveVisitors } from './admin-new/AdminActiveVisitors';
import { AdminVisitLogs } from './admin-new/AdminVisitLogs';

interface AdminPageProps {
  user: UserData;
  onLogout: () => void;
}

type TabType = 'register' | 'approvals' | 'tenants' | 'expected' | 'active' | 'logs';

export function AdminPage({ user, onLogout }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('register');
  
  // Safety check for user data
  if (!user || !user.username) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-900 text-xl mb-4">Error: Invalid user data</p>
          <Button onClick={onLogout}>Back to Login</Button>
        </div>
      </div>
    );
  }
  
  const displayName = user.fullName || user.username;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 text-xl">DormGuard System</h1>
                <p className="text-slate-500 text-sm">Administrator Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-slate-900">{displayName}</p>
                <p className="text-slate-500 text-sm">System Administrator</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white">{displayName.charAt(0).toUpperCase()}</span>
              </div>
              <Button variant="outline" onClick={onLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm overflow-x-auto">
        <div className="px-6">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register New Tenant
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              Approve/Reject Visitor Request
            </button>
            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'tenants'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <UserCog className="w-4 h-4" />
              Manage Tenant Profiles
            </button>
            <button
              onClick={() => setActiveTab('expected')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'expected'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              View Expected Visitors
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              View Active Visitors
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              View Visit Logs
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'register' && <AdminRegisterTenantComprehensive />}
          {activeTab === 'approvals' && <AdminVisitorApprovals />}
          {activeTab === 'tenants' && <AdminTenantManagement />}
          {activeTab === 'expected' && <AdminExpectedVisitors />}
          {activeTab === 'active' && <AdminActiveVisitors />}
          {activeTab === 'logs' && <AdminVisitLogs />}
        </div>
      </main>
    </div>
  );
}