import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { dataStore } from '../../lib/dataStore';
import { User, MapPin, Clock, Calendar, Phone, FileText } from 'lucide-react';

export function AdminActiveVisitors() {
  const [, setRefresh] = useState(0);
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Get all visitors with details
  const allVisitors = dataStore.getAllVisitorsWithDetails();
  
  // Filter for active visitors (checked in but not checked out)
  const activeVisitors = allVisitors.filter(v => 
    v.approval_status === 'Approved' && 
    v.log && 
    v.log.check_in_time && 
    !v.log.check_out_time
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 text-2xl mb-2">View Active Visitors</h2>
          <p className="text-slate-600">Shows a real-time list of all visitors who are currently checked into the dormitory</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg">
          <p className="text-sm text-center">
            <span className="text-3xl block mb-1">{activeVisitors.length}</span>
            Active Now
          </p>
        </div>
      </div>

      {activeVisitors.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No active visitors at the moment</p>
            <p className="text-slate-400 text-sm mt-2">All visitors have checked out</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeVisitors.map((visitor) => {
              const passCode = `DG-${visitor.tenant_room_number}-${visitor.visitor_id.toString().padStart(3, '0')}`;
              return (
                <Card key={visitor.visitor_id} className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 text-lg">{visitor.full_name || 'Unknown'}</h3>
                          <p className="text-slate-600 text-sm">Pass: {passCode}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600">
                        Inside
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User className="w-4 h-4 text-slate-500" />
                          <span>Visiting: <span className="text-slate-900">{visitor.tenant_name || 'N/A'}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span>Room {visitor.tenant_room_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span>{visitor.contact_number || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">Checked In:</span>
                        </div>
                        <p className="text-slate-900 ml-6 text-sm">
                          {visitor.log?.check_in_time && new Date(visitor.log.check_in_time).toLocaleString()}
                        </p>
                        {visitor.processed_by_name && (
                          <p className="text-slate-500 text-xs ml-6 mt-1">By: {visitor.processed_by_name}</p>
                        )}
                      </div>

                      {visitor.expected_time && (
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>Expected Time:</span>
                          </div>
                          <p className="text-slate-900 ml-6 text-sm">{visitor.expected_time}</p>
                        </div>
                      )}

                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                        <p className="text-orange-900 text-sm">
                          <span className="text-orange-700">Purpose:</span> {visitor.purpose || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}