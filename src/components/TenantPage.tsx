import { useState } from 'react';
import { Button } from './ui/button';
import { Users, LogOut, Plus, User } from 'lucide-react';
import { UserData } from '../App';
import { TenantProfile } from './tenant/TenantProfile';
import { TenantVisitors } from './tenant/TenantVisitors';
import { TenantRegisterVisitor } from './tenant/TenantRegisterVisitor';
import { NotificationBadge } from './tenant/NotificationBadge';

interface TenantPageProps {
  user: UserData;
  onLogout: () => void;
}

type TabType = 'profile' | 'visitors' | 'register';

export function TenantPage({ user, onLogout }: TenantPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('visitors');
  
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
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 text-xl">DormGuard System</h1>
                <p className="text-slate-500 text-sm">Tenant Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBadge tenantId={user.id} />
              <div className="text-right">
                <p className="text-slate-900">{displayName}</p>
                <p className="text-slate-500 text-sm">
                  {user.building && user.room ? `Building ${user.building}, Room ${user.room}` : 'Tenant'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
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
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <User className="w-4 h-4" />
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all ${
                activeTab === 'visitors'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              My Visitors
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              Pre-Register Visitor
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'profile' && <TenantProfile user={user} />}
          {activeTab === 'visitors' && <TenantVisitors user={user} />}
          {activeTab === 'register' && <TenantRegisterVisitor user={user} />}
        </div>
      </main>
    </div>
  );
}