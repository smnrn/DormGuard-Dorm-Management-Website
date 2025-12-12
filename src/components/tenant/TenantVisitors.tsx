import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { dataStore } from '../../lib/dataStore';
import { UserData } from '../../App';
import { Calendar, Clock, User, Phone, FileText, QrCode, CheckCircle, XCircle, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface TenantVisitorsProps {
  user: UserData;
}

export function TenantVisitors({ user }: TenantVisitorsProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [, setRefresh] = useState(0);
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Find current tenant
  const tenants = dataStore.getTenants();
  const tenant = tenants.find(t => t.username === user.username);
  
  // Get all visitors for this tenant with details
  const allVisitorsWithDetails = dataStore.getAllVisitorsWithDetails();
  const myVisitors = tenant ? allVisitorsWithDetails.filter(v => v.tenant_id === tenant.tenant_id) : [];

  // Filter by status
  let filteredVisitors = myVisitors;
  if (filterStatus !== 'all') {
    filteredVisitors = myVisitors.filter(v => v.approval_status === filterStatus);
  }

  const getStatusInfo = (status: string) => {
    const info: Record<string, { icon: any; color: string; label: string; variant: any }> = {
      'Pending': { icon: Clock, color: 'text-orange-600', label: 'Pending Approval', variant: 'outline' },
      'Approved': { icon: CheckCircle, color: 'text-green-600', label: 'Approved', variant: 'default' },
      'Denied': { icon: XCircle, color: 'text-red-600', label: 'Denied', variant: 'outline' },
    };
    return info[status] || info['Pending'];
  };

  // Get visitor logs to check check-in/out status
  const visitorLogs = dataStore.getVisitorLogs();

  const stats = {
    total: myVisitors.length,
    pending: myVisitors.filter(v => v.approval_status === 'Pending').length,
    approved: myVisitors.filter(v => v.approval_status === 'Approved').length,
    active: myVisitors.filter(v => {
      const log = visitorLogs.find(l => l.visitor_id === v.visitor_id);
      return log && log.check_in_time && !log.check_out_time;
    }).length,
  };

  // Generate pass code for approved visitors
  const getPassCode = (visitorId: number, roomNumber: string) => {
    return `DG-${roomNumber}-${visitorId.toString().padStart(3, '0')}`;
  };

  // Share digital pass function
  const shareDigitalPass = async (visitor: any) => {
    const passCode = getPassCode(visitor.visitor_id, visitor.tenant_room_number);
    const visitDate = new Date(visitor.expected_date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Create canvas for digital pass
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1620;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Background - Light gray
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Main Card Background - Blue
    const cardX = 80;
    const cardY = 80;
    const cardWidth = 920;
    const cardHeight = 1460;
    const cardRadius = 30;
    
    // Card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.roundRect(cardX + 8, cardY + 8, cardWidth, cardHeight, cardRadius);
    ctx.fill();
    
    // Card background - Blue gradient
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    cardGradient.addColorStop(0, '#3b82f6');
    cardGradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = cardGradient;
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();
    
    // DormGuard Logo Circle
    const logoX = 140;
    const logoY = 160;
    const logoRadius = 50;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Shield emoji in logo
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️', logoX, logoY + 18);
    
    // DormGuard Text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('DormGuard', 220, 155);
    ctx.font = '32px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Visitor Access Pass', 220, 195);
    
    // Status Badge - Top Right
    ctx.fillStyle = '#16a34a';
    ctx.roundRect(cardX + cardWidth - 180, 140, 140, 50, 25);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACTIVE', cardX + cardWidth - 110, 175);
    
    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, 280);
    ctx.lineTo(cardX + cardWidth - 60, 280);
    ctx.stroke();
    
    // Visitor Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(visitor.full_name || 'Unknown Visitor', cardX + 60, 380);
    
    // Section spacing
    let yPos = 480;
    const leftPadding = cardX + 60;
    
    // Helper function for label-value pairs
    const drawField = (label: string, value: string, y: number) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, leftPadding, y);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial';
      ctx.fillText(value, leftPadding, y + 45);
    };
    
    // Visitor ID
    drawField('VISITOR ID', `#${visitor.visitor_id}`, yPos);
    yPos += 130;
    
    // ID Number - only show if exists
    if (visitor.contact_number) {
      drawField('CONTACT NUMBER', visitor.contact_number, yPos);
      yPos += 130;
    }
    
    // Expected Date
    drawField('EXPECTED DATE', visitDate, yPos);
    yPos += 130;
    
    // Expected Time - only show if exists
    if (visitor.expected_time) {
      drawField('EXPECTED TIME', visitor.expected_time, yPos);
      yPos += 130;
    }
    
    // Purpose
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '28px Arial';
    ctx.fillText('PURPOSE', leftPadding, yPos);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    const purposeText = visitor.purpose.length > 35 ? visitor.purpose.substring(0, 35) + '...' : visitor.purpose;
    ctx.fillText(purposeText, leftPadding, yPos + 45);
    yPos += 130;
    
    // Room Number
    drawField('ROOM NUMBER', visitor.tenant_room_number, yPos);
    yPos += 150;
    
    // Pass Code Box - Centered
    const boxY = yPos;
    const boxWidth = 680;
    const boxHeight = 160;
    const boxX = cardX + (cardWidth - boxWidth) / 2;
    
    // White box background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
    ctx.fill();
    
    // Pass Code label
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACCESS CODE', cardX + cardWidth / 2, boxY + 50);
    
    // Pass Code
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(passCode, cardX + cardWidth / 2, boxY + 120);
    
    // Footer instruction
    yPos = cardY + cardHeight - 80;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Present this pass at security desk upon arrival', cardX + cardWidth / 2, yPos);
    
    // Timestamp at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.font = '22px Arial';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`Generated: ${timestamp}`, cardX + cardWidth / 2, yPos + 40);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'dormguard-digital-pass.png', { type: 'image/png' });
      
      try {
        // Try to use Web Share API with the image
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'DormGuard Digital Access Pass',
            text: `Digital Access Pass for ${visitor.full_name || 'Visitor'}`,
            files: [file],
          });
          return; // Successfully shared
        }
      } catch (error: any) {
        console.log('Share cancelled or failed, falling back to download');
      }
      
      // Fallback: Download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DormGuard-Pass-${(visitor.full_name || 'Visitor').replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Digital Pass downloaded! You can now share it with your visitor.');
    }, 'image/png');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 text-2xl mb-2">My Visitors</h2>
        <p className="text-slate-600">Track and manage your visitor requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Total Visitors</p>
              <p className="text-slate-900 text-3xl mt-1">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Pending</p>
              <p className="text-orange-600 text-3xl mt-1">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Approved</p>
              <p className="text-green-600 text-3xl mt-1">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Currently Inside</p>
              <p className="text-blue-600 text-3xl mt-1">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList>
              <TabsTrigger value="all">All ({myVisitors.length})</TabsTrigger>
              <TabsTrigger value="Pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="Approved">Approved ({stats.approved})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVisitors.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No visitors found</p>
                <p className="text-slate-400 text-sm mt-1">Pre-register a new visitor to get started</p>
              </div>
            ) : (
              filteredVisitors.map((visitor) => {
                const statusInfo = getStatusInfo(visitor.approval_status);
                const StatusIcon = statusInfo.icon;
                const isActive = visitor.log && visitor.log.check_in_time && !visitor.log.check_out_time;
                const isCompleted = visitor.log && visitor.log.check_out_time;

                return (
                  <div
                    key={visitor.visitor_id}
                    className={`p-5 border-2 rounded-lg ${
                      isActive ? 'border-blue-200 bg-blue-50' :
                      visitor.approval_status === 'Approved' ? 'border-green-200 bg-green-50' :
                      visitor.approval_status === 'Pending' ? 'border-orange-200 bg-orange-50' :
                      visitor.approval_status === 'Denied' ? 'border-red-200 bg-red-50' :
                      'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                        <div>
                          <h3 className="text-slate-900 text-lg">{visitor.full_name || 'Unknown'}</h3>
                          <p className="text-slate-600 text-sm">{visitor.purpose || 'No purpose specified'}</p>
                        </div>
                      </div>
                      <Badge variant={statusInfo.variant}>
                        {isActive ? 'Currently Inside' : isCompleted ? 'Completed' : statusInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{visitor.contact_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>{visitor.expected_date ? new Date(visitor.expected_date).toLocaleDateString() : 'Invalid Date'}</span>
                      </div>
                      {visitor.expected_time && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{visitor.expected_time}</span>
                        </div>
                      )}
                    </div>

                    {visitor.approval_status === 'Approved' && (
                      <div className="bg-white p-4 rounded-lg border-2 border-green-300 mb-4">
                        <div className="flex items-center gap-3">
                          <QrCode className="w-10 h-10 text-green-600" />
                          <div className="flex-1">
                            <p className="text-slate-600 text-sm mb-1">Digital Access Pass</p>
                            <p className="text-green-600 text-xl">
                              {getPassCode(visitor.visitor_id, visitor.tenant_room_number)}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">Present this code at security desk</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => shareDigitalPass(visitor)}>Share</Button>
                        </div>
                      </div>
                    )}

                    {visitor.log && visitor.log.check_in_time && (
                      <div className="bg-white p-3 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <LogIn className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-slate-600 text-xs">Checked In:</p>
                              <p className="text-slate-900 text-sm">{new Date(visitor.log.check_in_time).toLocaleString()}</p>
                            </div>
                          </div>
                          {visitor.log.check_out_time && (
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4 text-orange-600" />
                              <div>
                                <p className="text-slate-600 text-xs">Checked Out:</p>
                                <p className="text-slate-900 text-sm">{new Date(visitor.log.check_out_time).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {visitor.processed_by_name && (
                          <p className="text-slate-500 text-xs mt-2">Processed by: {visitor.processed_by_name}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Requested: {new Date(visitor.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}