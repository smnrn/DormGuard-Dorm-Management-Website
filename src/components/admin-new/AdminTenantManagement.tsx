import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { dataStore } from '../../lib/dataStore';
import { Search, Mail, Phone, MapPin, User, Calendar, Home, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminTenantManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Subscribe to data changes
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
      console.log('Refreshing tenant data...');
      await dataStore.refreshAll();
      console.log('Refresh complete');
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tenants = dataStore.getTenants();
  console.log('Current tenants:', tenants);
  
  // Count active tenants (status is 'Active')
  const activeTenantCount = tenants.filter(t => t.status === 'Active').length;

  const handleStatusChange = async (tenantId: number, newStatus: string) => {
    try {
      // Update tenant status (backend will handle room occupancy)
      await dataStore.updateTenant(tenantId, { status: newStatus });
      
      // Force refresh to update room occupancy display
      await handleRefresh();
      
      // Show success message
      const statusMsg = newStatus === 'Active' ? 'returned to active status' : 'moved out';
      console.log(`Tenant ${tenantId} ${statusMsg}. Room occupancy updated.`);
    } catch (error) {
      console.error('Failed to update tenant status:', error);
      alert('Failed to update tenant status. Please try again.');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const searchLower = searchTerm.toLowerCase();
    const tenantWithRoom = dataStore.getTenantWithRoom(tenant.tenant_id);
    return (
      tenant.full_name.toLowerCase().includes(searchLower) ||
      tenant.email.toLowerCase().includes(searchLower) ||
      tenant.username.toLowerCase().includes(searchLower) ||
      tenantWithRoom?.room_number.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 text-2xl mb-2">Manage Tenant Profiles</h2>
          <p className="text-slate-600">View and update tenant information and room assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
            <p className="text-sm">
              <span className="text-2xl mr-2">{activeTenantCount}</span>
              Active Tenants
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, username, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <AnimatePresence>
                {searchFocused && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div className="text-sm text-slate-600">
              {filteredTenants.length} of {tenants.length} tenants
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No tenants found</p>
              </div>
            ) : (
              filteredTenants.map((tenant) => {
                const tenantWithRoom = dataStore.getTenantWithRoom(tenant.tenant_id);
                return (
                  <div
                    key={tenant.tenant_id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white">{tenant.full_name.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-slate-900">{tenant.full_name}</h3>
                            <p className="text-slate-500 text-sm">@{tenant.username}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={tenant.status === 'Active' ? 'default' : 'secondary'}>
                              {tenant.status}
                            </Badge>
                            <Select
                              value={tenant.status}
                              onValueChange={(value) => handleStatusChange(tenant.tenant_id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="Change Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Moved Out">Moved Out</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {tenant.email}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {tenant.contact_number}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Home className="w-4 h-4 text-slate-400" />
                            Room {tenantWithRoom?.room_number || 'N/A'}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Move-in: {new Date(tenant.move_in_date).toLocaleDateString()}</span>
                          </div>
                          {tenantWithRoom && (
                            <div>
                              <span className="text-slate-500">Room Occupancy:</span>{' '}
                              <span className="text-slate-900">
                                {tenantWithRoom.room_current_occupants}/{tenantWithRoom.room_capacity}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Total Rooms</p>
              <p className="text-slate-900 text-3xl mt-1">{dataStore.getRooms().length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Occupied Rooms</p>
              <p className="text-blue-600 text-3xl mt-1">
                {dataStore.getRooms().filter(r => r.current_occupants > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Available Rooms</p>
              <p className="text-green-600 text-3xl mt-1">
                {dataStore.getRooms().filter(r => r.current_occupants < r.capacity).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Total Tenants</p>
              <p className="text-purple-600 text-3xl mt-1">{tenants.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}