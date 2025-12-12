import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar, User, MapPin, Phone, Mail } from 'lucide-react';
import { dataStore } from '../../lib/dataStore';

export function AdminExpectedVisitors() {
  const [, setRefresh] = useState(0);
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const allVisitors = dataStore.getAllVisitorsWithDetails();
  const approvedVisitors = allVisitors.filter(v => v.approval_status === 'Approved');
  
  // Get today's date in YYYY-MM-DD format (local timezone)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Filter for today's approved visitors only
  // Handle both Date objects and string formats from database
  const todaysVisitors = approvedVisitors.filter(v => {
    if (!v.expected_date) return false;
    
    // Convert expected_date to YYYY-MM-DD format
    let dateStr = '';
    if (v.expected_date instanceof Date) {
      dateStr = `${v.expected_date.getFullYear()}-${String(v.expected_date.getMonth() + 1).padStart(2, '0')}-${String(v.expected_date.getDate()).padStart(2, '0')}`;
    } else if (typeof v.expected_date === 'string') {
      // Handle ISO string format "2025-12-05T00:00:00.000Z" or "2025-12-05"
      dateStr = v.expected_date.split('T')[0];
    }
    
    return dateStr === todayStr;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 text-2xl mb-2">Today's Expected Visitors</h2>
        <p className="text-slate-600">
          Real-time view of approved visitors expected today ({new Date().toLocaleDateString()})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Expected Today</p>
                <p className="text-slate-900 text-2xl">{todaysVisitors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Unique Tenants</p>
                <p className="text-slate-900 text-2xl">
                  {new Set(todaysVisitors.map(v => v.tenant_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Total Approved</p>
                <p className="text-slate-900 text-2xl">{approvedVisitors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Visitor List - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysVisitors.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No approved visitors expected today</p>
              <p className="text-slate-400 text-sm mt-1">Check back later or view all approved visitors</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Visiting</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Expected Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysVisitors.map((visitor) => (
                    <TableRow key={visitor.visitor_id}>
                      <TableCell>
                        <div>
                          <p className="text-slate-900">{visitor.full_name || 'Unknown'}</p>
                          <p className="text-slate-500 text-xs">ID: #{visitor.visitor_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm text-slate-700">
                            <Phone className="w-3 h-3" />
                            {visitor.contact_number || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-slate-900">{visitor.tenant_name || 'N/A'}</p>
                          <p className="text-slate-500 text-xs">{visitor.tenant_contact || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{visitor.tenant_room_number || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-slate-700 text-sm max-w-[200px] truncate">
                          {visitor.purpose || 'Not specified'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-slate-700 text-sm">
                          {visitor.expected_date ? new Date(visitor.expected_date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Invalid Date'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}