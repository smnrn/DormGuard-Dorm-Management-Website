import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { dataStore } from '../../lib/dataStore';
import { VisitorWithDetails } from '../../lib/types';
import { Search, Check, X, Clock, User, Phone, Calendar, MapPin, FileText, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { adminAPI } from '../../lib/api';

export function AdminVisitorApprovals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorWithDetails | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [, setRefresh] = useState(0);
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const allVisitors = dataStore.getAllVisitorsWithDetails();
  const pendingVisitors = allVisitors.filter(v => v.approval_status === 'Pending');
  
  const filteredVisitors = pendingVisitors.filter(visitor =>
    visitor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.tenant_room_number.includes(searchTerm)
  );

  const handleApprove = (visitor: VisitorWithDetails) => {
    setSelectedVisitor(visitor);
    setShowApproveDialog(true);
  };

  const handleReject = (visitor: VisitorWithDetails) => {
    setSelectedVisitor(visitor);
    setShowRejectDialog(true);
  };

  const confirmApproval = async () => {
    if (selectedVisitor) {
      try {
        await adminAPI.approveVisitor(selectedVisitor.visitor_id);
        alert('Visitor approved! Digital pass has been generated and sent to tenant.');
        setShowApproveDialog(false);
        setSelectedVisitor(null);
        
        // Force refresh to update the list
        await dataStore.refreshVisitors();
      } catch (error: any) {
        alert('Failed to approve visitor: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const confirmRejection = async () => {
    if (selectedVisitor) {
      try {
        await adminAPI.rejectVisitor(selectedVisitor.visitor_id);
        alert('Visitor request has been rejected. Tenant will be notified.');
        setShowRejectDialog(false);
        setSelectedVisitor(null);
        setRejectionReason('');
        
        // Force refresh to update the list
        await dataStore.refreshVisitors();
      } catch (error: any) {
        alert('Failed to reject visitor: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Generate pass code
  const getPassCode = (visitorId: number, roomNumber: string) => {
    return `DG-${roomNumber}-${visitorId.toString().padStart(3, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 text-2xl mb-2">Approve/Reject Visitor Requests</h2>
          <p className="text-slate-600">Review and approve pending visitor registration requests from tenants</p>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
          <p className="text-sm">
            <span className="text-2xl mr-2">{pendingVisitors.length}</span>
            Pending Approvals
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by visitor name, tenant, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVisitors.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No pending approvals</p>
              </div>
            ) : (
              filteredVisitors.map((visitor) => (
                <div
                  key={visitor.visitor_id}
                  className="p-5 border-2 border-orange-200 bg-orange-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-slate-900 text-lg">{visitor.full_name}</h3>
                        <Badge className="bg-orange-100 text-orange-700">
                          Pending Approval
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User className="w-4 h-4 text-slate-500" />
                          <span>Tenant: <span className="text-slate-900">{visitor.tenant_name}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span>Room {visitor.tenant_room_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span>{visitor.contact_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>{new Date(visitor.expected_date).toLocaleDateString()}</span>
                        </div>
                        {visitor.expected_time && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{visitor.expected_time}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-white p-3 rounded-lg mb-4">
                        <p className="text-slate-600 text-sm mb-1">Purpose of Visit:</p>
                        <p className="text-slate-900">{visitor.purpose}</p>
                      </div>

                      <p className="text-slate-500 text-xs">
                        Request submitted: {new Date(visitor.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(visitor)}
                      className="gap-2 bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <Check className="w-4 h-4" />
                      Approve Visitor
                    </Button>
                    <Button
                      onClick={() => handleReject(visitor)}
                      variant="outline"
                      className="gap-2 border-red-200 text-red-700 hover:bg-red-50 flex-1"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Visitor Request</DialogTitle>
            <DialogDescription>
              Generate a temporary access pass for this visitor
            </DialogDescription>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <QrCode className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-slate-900">Digital Pass Code</p>
                    <p className="text-green-600 text-xl">{getPassCode(selectedVisitor.visitor_id, selectedVisitor.tenant_room_number)}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">
                  This code will be sent to {selectedVisitor.full_name} and {selectedVisitor.tenant_name}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="text-sm"><span className="text-slate-600">Visitor:</span> <span className="text-slate-900">{selectedVisitor.full_name}</span></p>
                <p className="text-sm"><span className="text-slate-600">Tenant:</span> <span className="text-slate-900">{selectedVisitor.tenant_name}</span></p>
                <p className="text-sm"><span className="text-slate-600">Location:</span> <span className="text-slate-900">Room {selectedVisitor.tenant_room_number}</span></p>
                <p className="text-sm"><span className="text-slate-600">Date:</span> <span className="text-slate-900">{new Date(selectedVisitor.expected_date).toLocaleDateString()}</span></p>
                {selectedVisitor.expected_time && (
                  <p className="text-sm"><span className="text-slate-600">Time:</span> <span className="text-slate-900">{selectedVisitor.expected_time}</span></p>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={confirmApproval} className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  Confirm Approval
                </Button>
                <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Visitor Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="text-sm"><span className="text-slate-600">Visitor:</span> <span className="text-slate-900">{selectedVisitor.full_name}</span></p>
                <p className="text-sm"><span className="text-slate-600">Tenant:</span> <span className="text-slate-900">{selectedVisitor.tenant_name}</span></p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejecting this visitor request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmRejection}
                  variant="outline"
                  className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  disabled={!rejectionReason.trim()}
                >
                  <X className="w-4 h-4" />
                  Confirm Rejection
                </Button>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}