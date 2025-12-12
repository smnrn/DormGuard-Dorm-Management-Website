import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Shield, LogOut, Search, CheckCircle, XCircle, Clock, UserCheck, UserX, Headphones, RefreshCw } from 'lucide-react';
import { UserData } from '../App';
import { dataStore } from '../lib/dataStore';
import { VisitorWithDetails } from '../lib/types';
import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { isTodayString } from '../lib/dateUtils';

interface HelpDeskPageProps {
  user: UserData;
  onLogout: () => void;
}

export function HelpDeskPage({ user, onLogout }: HelpDeskPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'approved' | 'active'>('approved');
  const [, setRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  
  // Real-time sync - poll every 5 seconds
  const { isSyncing, lastSyncTime } = useRealTimeSync({
    enabled: true,
    interval: 5000,
    onSync: async () => {
      await dataStore.refreshAll();
    },
  });
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);
  
  // Load data on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dataStore.refreshAll();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get all approved visitors with details (using the fixed dataStore method)
  const allVisitors = dataStore.getAllVisitorsWithDetails();
  const approvedVisitors = allVisitors.filter(v => v.approval_status === 'Approved');
  
  // Filter for today's approved visitors who are NOT checked in yet
  // Use the new isTodayString function for accurate date matching regardless of format
  const todaysApprovedVisitors = approvedVisitors.filter(v => {
    // Check if expected_date is today (handles various date formats)
    const isExpectedToday = isTodayString(v.expected_date);
    
    // Not checked in yet (no active log)
    const hasActiveLog = v.log && v.log.check_in_time && !v.log.check_out_time;
    
    // Show if expected today AND not currently checked in
    return isExpectedToday && !hasActiveLog;
  });

  // Get active visitors (checked in but not checked out)
  // The dataStore now correctly returns the most recent active log
  const activeVisitors = approvedVisitors.filter(v => {
    return v.log && v.log.check_in_time && !v.log.check_out_time;
  });

  // Filter visitors based on search
  const displayVisitors = activeTab === 'approved' ? todaysApprovedVisitors : activeVisitors;
  const filteredVisitors = displayVisitors.filter(visitor =>
    (visitor.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (visitor.tenant_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (visitor.tenant_room_number || '').includes(searchQuery) ||
    (visitor.contact_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckIn = (visitor: VisitorWithDetails) => {
    const log = {
      visitor_id: visitor.visitor_id,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      id_left: visitor.contact_number || 'N/A', // Store contact as ID reference
      processed_by: 1, // Help desk ID - should use actual user ID in production
    };
    dataStore.addVisitorLog(log);
    alert(`Checked in ${visitor.full_name || 'Visitor'}. Visitor ID: ${visitor.visitor_id}`);
  };

  const handleCheckOut = (visitor: VisitorWithDetails) => {
    const visitorLogs = dataStore.getVisitorLogs();
    const log = visitorLogs.find(l => l.visitor_id === visitor.visitor_id && !l.check_out_time);
    if (log) {
      dataStore.updateVisitorLog(log.log_id, {
        check_out_time: new Date().toISOString(),
      });
      alert(`Checked out ${visitor.full_name || 'Visitor'}. You can now return their ID.`);
    }
  };

  const isCheckedIn = (visitorId: number) => {
    const visitorLogs = dataStore.getVisitorLogs();
    const log = visitorLogs.find(l => l.visitor_id === visitorId);
    return log && log.check_in_time && !log.check_out_time;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <Headphones className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 text-2xl">Help Desk Portal</h1>
                <p className="text-slate-600 text-sm">Visitor Check-In & Check-Out Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isSyncing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || isSyncing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* Sync Status */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {isSyncing ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Syncing...
                  </span>
                ) : lastSyncTime ? (
                  <span>Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>
                ) : null}
              </div>
              
              <div className="text-right">
                <p className="text-slate-900">{displayName}</p>
                <p className="text-slate-500 text-sm">Help Desk Staff</p>
              </div>
              <Button variant="outline" onClick={onLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Today's Approved</p>
                  <p className="text-slate-900 text-2xl">{todaysApprovedVisitors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Currently Inside</p>
                  <p className="text-slate-900 text-2xl">{activeVisitors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Total Approved</p>
                  <p className="text-slate-900 text-2xl">{approvedVisitors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Visitor Management</CardTitle>
                <p className="text-slate-600 text-sm mt-1">
                  Monitor and manage visitor check-ins and check-outs
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'approved' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('approved')}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Today's Approved
                </Button>
                <Button
                  variant={activeTab === 'active' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('active')}
                  className="gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Currently Inside
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by visitor name, tenant name, or room number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Visitors Table */}
            {filteredVisitors.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {searchQuery
                    ? 'No visitors found matching your search.'
                    : activeTab === 'approved'
                    ? 'No approved visitors for today.'
                    : 'No visitors currently inside.'}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Access Code</TableHead>
                      <TableHead>Visiting</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => {
                      const checkedIn = isCheckedIn(visitor.visitor_id);
                      const accessCode = `DG-${visitor.tenant_room_number}-${visitor.visitor_id.toString().padStart(3, '0')}`;
                      return (
                        <TableRow key={visitor.visitor_id}>
                          <TableCell>
                            <div>
                              <p className="text-slate-900">{visitor.full_name || 'Unknown'}</p>
                              <p className="text-slate-500 text-xs">{visitor.contact_number || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              #{visitor.visitor_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                              {accessCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-slate-900">{visitor.tenant_name}</p>
                              <p className="text-slate-500 text-xs">{visitor.tenant_contact}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{visitor.tenant_room_number}</Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-slate-700 text-sm max-w-[200px] truncate">
                              {visitor.purpose}
                            </p>
                          </TableCell>
                          <TableCell>
                            {checkedIn ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Inside
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {checkedIn ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckOut(visitor)}
                                className="gap-2 text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Check Out
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(visitor)}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Check In
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="text-blue-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Help Desk Procedures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-blue-900 mb-2">Check-In Process:</h4>
                <ol className="space-y-2 text-blue-700">
                  <li>1. Verify visitor name on approved list</li>
                  <li>2. Request and collect physical ID</li>
                  <li>3. Verify ID matches the ID number in system</li>
                  <li>4. Click "Check In" button to log entry time</li>
                  <li>5. Keep ID secured until check-out</li>
                </ol>
              </div>
              <div>
                <h4 className="text-blue-900 mb-2">Check-Out Process:</h4>
                <ol className="space-y-2 text-blue-700">
                  <li>1. Verify visitor identity when they return</li>
                  <li>2. Click "Check Out" button to log exit time</li>
                  <li>3. Return their physical ID</li>
                  <li>4. Ensure all visitor belongings are collected</li>
                  <li>5. Visitor record is now complete</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Code Verification Card */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Access Code Verification
            </h3>
            <div className="text-sm text-green-700">
              <p className="mb-3">All approved visitors have a unique access code in the format: <strong>DG-[ROOM]-[ID]</strong></p>
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <p className="text-green-900 mb-2"><strong>Example:</strong> DG-A101-005</p>
                <ul className="space-y-1 text-green-700">
                  <li>• DG = DormGuard prefix</li>
                  <li>• A101 = Room number being visited</li>
                  <li>• 005 = Visitor ID number</li>
                </ul>
              </div>
              <p className="mt-3 text-green-600">Verify this code matches the digital pass shown by the visitor before check-in.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}