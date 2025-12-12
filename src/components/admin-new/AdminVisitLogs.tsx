import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { dataStore } from '../../lib/dataStore';
import { Search, Download, Calendar, Clock, User, MapPin, LogIn, LogOut, Phone, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { motion } from 'motion/react';

export function AdminVisitLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [, setRefresh] = useState(0);
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const getStatusBadge = (status: string, hasLog: boolean, isActive: boolean) => {
    if (hasLog && isActive) {
      return { 
        className: 'bg-green-100 text-green-700 border-green-200', 
        label: 'Active - Inside' 
      };
    }
    if (hasLog && !isActive) {
      return { 
        className: 'bg-slate-100 text-slate-700 border-slate-200', 
        label: 'Completed' 
      };
    }
    const variants: Record<string, { className: string; label: string }> = {
      'Approved': { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Approved - Not Checked In' },
      'Pending': { className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Pending Approval' },
      'Denied': { className: 'bg-red-100 text-red-700 border-red-200', label: 'Denied' },
    };
    return variants[status] || { className: 'bg-slate-100 text-slate-700 border-slate-200', label: status };
  };

  const allVisitors = dataStore.getAllVisitorsWithDetails();
  const visitorLogs = dataStore.getVisitorLogs();
  
  let filteredLogs = allVisitors;
  
  if (filterStatus === 'active') {
    filteredLogs = filteredLogs.filter(v => {
      const log = visitorLogs.find(l => l.visitor_id === v.visitor_id);
      return log && log.check_in_time && !log.check_out_time;
    });
  } else if (filterStatus === 'completed') {
    filteredLogs = filteredLogs.filter(v => {
      const log = visitorLogs.find(l => l.visitor_id === v.visitor_id);
      return log && log.check_out_time;
    });
  } else if (filterStatus === 'approved') {
    filteredLogs = filteredLogs.filter(v => {
      const log = visitorLogs.find(l => l.visitor_id === v.visitor_id);
      return v.approval_status === 'Approved' && !log;
    });
  } else if (filterStatus === 'pending') {
    filteredLogs = filteredLogs.filter(v => v.approval_status === 'Pending');
  }
  
  if (searchTerm) {
    filteredLogs = filteredLogs.filter(visitor =>
      visitor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.tenant_room_number?.includes(searchTerm) ||
      visitor.contact_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const exportLogs = () => {
    try {
      // Prepare data for export
      const csvData = filteredLogs.map(visitor => {
        const log = visitorLogs.find(l => l.visitor_id === visitor.visitor_id);
        
        return {
          'Visitor ID': visitor.visitor_id,
          'Visitor Name': visitor.full_name || 'N/A',
          'Contact': visitor.contact_number || 'N/A',
          'Tenant Name': visitor.tenant_name || 'N/A',
          'Room Number': visitor.tenant_room_number || 'N/A',
          'Visit Date': visitor.expected_date ? new Date(visitor.expected_date).toLocaleDateString() : 'Invalid Date',
          'Expected Time': visitor.expected_time || 'N/A',
          'Purpose': visitor.purpose || 'N/A',
          'Approval Status': visitor.approval_status,
          'Check-In Time': log?.check_in_time ? new Date(log.check_in_time).toLocaleString() : 'Not Checked In',
          'Check-Out Time': log?.check_out_time ? new Date(log.check_out_time).toLocaleString() : 'Not Checked Out',
          'Status': log && log.check_in_time && !log.check_out_time ? 'Currently Inside' : 
                   log && log.check_out_time ? 'Completed' : 'Not Checked In'
        };
      });

      // Convert to CSV format
      if (csvData.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        )
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `visitor_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      alert(`Successfully exported ${csvData.length} visitor log records!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-slate-900 text-2xl mb-2">View Visit Logs</h2>
          <p className="text-slate-600">Comprehensive searchable log of all visitor entries and exits</p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by visitor, tenant, room, contact, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 whitespace-nowrap">
                <span className="font-semibold">{filteredLogs.length}</span> records
              </div>
            </div>

            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No visitor logs found</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((visitor, index) => {
                const log = visitorLogs.find(l => l.visitor_id === visitor.visitor_id);
                const isActive = log && log.check_in_time && !log.check_out_time;
                const statusInfo = getStatusBadge(visitor.approval_status, !!log, !!isActive);
                
                return (
                  <motion.div
                    key={visitor.visitor_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-green-100' : 'bg-slate-200'
                        }`}>
                          <User className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <h3 className="text-slate-900 text-lg">{visitor.full_name || 'Unknown Visitor'}</h3>
                          <p className="text-slate-500 text-sm">Visitor ID: #{visitor.visitor_id}</p>
                        </div>
                      </div>
                      <Badge className={`${statusInfo.className} border px-3 py-1`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-600">Tenant: <span className="text-slate-900 font-medium">{visitor.tenant_name || 'N/A'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span className="text-slate-600">Room: <span className="text-slate-900 font-medium">{visitor.tenant_room_number || 'N/A'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-green-500" />
                        <span className="text-slate-600">Contact: <span className="text-slate-900 font-medium">{visitor.contact_number || 'N/A'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-slate-600">Date: <span className="text-slate-900 font-medium">
                          {visitor.expected_date ? new Date(visitor.expected_date).toLocaleDateString() : 'Invalid Date'}
                        </span></span>
                      </div>
                      {visitor.expected_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <span className="text-slate-600">Time: <span className="text-slate-900 font-medium">{visitor.expected_time}</span></span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg mb-3">
                      <p className="text-slate-600 text-sm mb-1">Purpose of Visit:</p>
                      <p className="text-slate-900">{visitor.purpose || 'Not specified'}</p>
                    </div>

                    {log && log.check_in_time && (
                      <div className={`p-4 rounded-lg border-2 ${
                        isActive ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <LogIn className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-slate-600 text-xs">Check-In Time</p>
                              <p className="text-slate-900 font-medium">{new Date(log.check_in_time).toLocaleString()}</p>
                            </div>
                          </div>
                          {log.check_out_time ? (
                            <div className="flex items-center gap-2">
                              <LogOut className="w-5 h-5 text-orange-600" />
                              <div>
                                <p className="text-slate-600 text-xs">Check-Out Time</p>
                                <p className="text-slate-900 font-medium">{new Date(log.check_out_time).toLocaleString()}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-green-600 animate-pulse" />
                              <div>
                                <p className="text-green-700 font-medium">Currently Inside Building</p>
                                <p className="text-green-600 text-xs">Awaiting checkout</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {visitor.processed_by_name && (
                          <p className="text-slate-500 text-xs mt-3 pt-3 border-t border-slate-200">
                            Processed by: <span className="text-slate-700 font-medium">{visitor.processed_by_name}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {!log && visitor.approval_status === 'Approved' && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-blue-700 text-sm">
                          ✓ Approved visitor has not checked in yet
                        </p>
                      </div>
                    )}

                    {visitor.approval_status === 'Pending' && (
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                        <p className="text-orange-700 text-sm">
                          ⏳ Awaiting admin approval
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200">
                      <span>Request submitted: {new Date(visitor.created_at).toLocaleString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
