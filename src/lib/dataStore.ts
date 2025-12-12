import { Visitor, VisitorLog, Tenant, Room, VisitorWithDetails, TenantWithRoom } from './types';
import { visitorAPI, visitorLogAPI, adminAPI, tenantAPI } from './api';

// Global data store with listeners for reactivity and backend sync
class DataStore {
  private visitors: Visitor[] = [];
  private visitorLogs: VisitorLog[] = [];
  private tenants: Tenant[] = [];
  private rooms: Room[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;
  
  // Cache for expensive computed values
  private cache: {
    allVisitorsWithDetails?: VisitorWithDetails[];
    lastCacheTime?: number;
  } = {};
  
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  // Subscribe to data changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  private notify() {
    // Clear cache when data changes
    this.cache = {};
    this.listeners.forEach(listener => listener());
  }

  // Initialize data from backend
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load initial data from backend
      await this.refreshAll();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize data store:', error);
    }
  }

  // Refresh all data from backend
  async refreshAll() {
    try {
      const startTime = performance.now();
      
      const [visitors, logs, tenants, rooms] = await Promise.all([
        visitorAPI.getAllVisitors().catch(() => []),
        visitorLogAPI.getVisitorLogs().catch(() => []),
        adminAPI.getTenants().catch(() => []),
        adminAPI.getRooms().catch(() => []),
      ]);

      this.visitors = visitors;
      this.visitorLogs = logs;
      this.tenants = tenants;
      this.rooms = rooms;
      
      const endTime = performance.now();
      console.log(`DataStore refreshAll took ${(endTime - startTime).toFixed(2)}ms`);
      
      this.notify();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  // Visitor operations
  getVisitors(): Visitor[] {
    return [...this.visitors];
  }

  async addVisitor(visitor: Omit<Visitor, 'visitor_id'>): Promise<Visitor> {
    try {
      // Data is already in correct format, pass it through directly
      const response = await tenantAPI.registerVisitor({
        full_name: visitor.full_name,
        contact_number: visitor.contact_number,
        purpose: visitor.purpose,
        expected_date: visitor.expected_date,
        expected_time: visitor.expected_time || '',
      });
      
      // Refresh visitors from backend
      await this.refreshVisitors();
      return response.visitor;
    } catch (error) {
      console.error('Failed to add visitor:', error);
      throw error;
    }
  }

  async updateVisitor(visitorId: number, updates: Partial<Visitor>): Promise<void> {
    try {
      await tenantAPI.updateVisitor(visitorId, updates);
      
      // Update local cache
      const index = this.visitors.findIndex(v => v.visitor_id === visitorId);
      if (index !== -1) {
        this.visitors[index] = { ...this.visitors[index], ...updates };
        this.notify();
      }
    } catch (error) {
      console.error('Failed to update visitor:', error);
      throw error;
    }
  }

  async deleteVisitor(visitorId: number): Promise<void> {
    try {
      await tenantAPI.deleteVisitor(visitorId);
      
      // Update local cache
      this.visitors = this.visitors.filter(v => v.visitor_id !== visitorId);
      this.notify();
    } catch (error) {
      console.error('Failed to delete visitor:', error);
      throw error;
    }
  }

  async refreshVisitors(): Promise<void> {
    try {
      this.visitors = await visitorAPI.getAllVisitors();
      this.notify();
    } catch (error) {
      console.error('Failed to refresh visitors:', error);
    }
  }

  // Visitor Log operations
  getVisitorLogs(): VisitorLog[] {
    return [...this.visitorLogs];
  }

  async addVisitorLog(log: { visitor_id: number; processed_by: number }): Promise<VisitorLog> {
    try {
      const response = await visitorLogAPI.checkinVisitor(log.visitor_id, log.processed_by);
      
      // Refresh logs from backend
      await this.refreshVisitorLogs();
      return response.log;
    } catch (error) {
      console.error('Failed to add visitor log:', error);
      throw error;
    }
  }

  async updateVisitorLog(logId: number, updates: Partial<VisitorLog>): Promise<void> {
    try {
      // If checking out, use the checkout endpoint
      if (updates.checkout_time) {
        await visitorLogAPI.checkoutVisitor(logId);
      }
      
      // Update local cache
      const index = this.visitorLogs.findIndex(l => l.log_id === logId);
      if (index !== -1) {
        this.visitorLogs[index] = { ...this.visitorLogs[index], ...updates };
        this.notify();
      }
    } catch (error) {
      console.error('Failed to update visitor log:', error);
      throw error;
    }
  }

  async refreshVisitorLogs(): Promise<void> {
    try {
      this.visitorLogs = await visitorLogAPI.getVisitorLogs();
      this.notify();
    } catch (error) {
      console.error('Failed to refresh visitor logs:', error);
    }
  }

  // Tenant operations
  getTenants(): Tenant[] {
    return [...this.tenants];
  }

  async addTenant(tenant: Omit<Tenant, 'tenant_id'>): Promise<Tenant> {
    try {
      const response = await adminAPI.registerTenant({
        username: tenant.username,
        password: '', // Will be set by admin
        full_name: tenant.full_name,
        email: tenant.email,
        contact_number: tenant.contact_number,
        room_id: tenant.room_id,
      });
      
      // Refresh tenants from backend
      await this.refreshTenants();
      return response.tenant;
    } catch (error) {
      console.error('Failed to add tenant:', error);
      throw error;
    }
  }

  async updateTenant(tenantId: number, updates: Partial<Tenant>): Promise<void> {
    try {
      await adminAPI.updateTenant(tenantId, updates);
      
      // Update local cache
      const index = this.tenants.findIndex(t => t.tenant_id === tenantId);
      if (index !== -1) {
        this.tenants[index] = { ...this.tenants[index], ...updates };
        this.notify();
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
      throw error;
    }
  }

  async refreshTenants(): Promise<void> {
    try {
      this.tenants = await adminAPI.getTenants();
      this.notify();
    } catch (error) {
      console.error('Failed to refresh tenants:', error);
    }
  }

  // Room operations
  getRooms(): Room[] {
    return [...this.rooms];
  }

  async refreshRooms(): Promise<void> {
    try {
      this.rooms = await adminAPI.getRooms();
      this.notify();
    } catch (error) {
      console.error('Failed to refresh rooms:', error);
    }
  }

  // Helper methods for joined data
  getVisitorWithDetails(visitorId: number): VisitorWithDetails | undefined {
    const visitor = this.visitors.find(v => v.visitor_id === visitorId);
    if (!visitor) return undefined;

    const tenant = this.tenants.find(t => t.tenant_id === visitor.tenant_id);
    const room = tenant ? this.rooms.find(r => r.room_id === tenant.room_id) : undefined;
    const log = this.visitorLogs.find(l => l.visitor_id === visitorId);

    return {
      ...visitor,
      tenant_name: tenant?.full_name || 'Unknown',
      tenant_room_number: room?.room_number || 'N/A',
      tenant_contact: tenant?.contact_number || 'N/A',
      log,
    };
  }

  getAllVisitorsWithDetails(): VisitorWithDetails[] {
    const currentTime = Date.now();
    if (this.cache.allVisitorsWithDetails && currentTime - this.cache.lastCacheTime! < this.CACHE_TTL) {
      return this.cache.allVisitorsWithDetails;
    }

    const result = this.visitors.map(visitor => {
      const tenant = this.tenants.find(t => t.tenant_id === visitor.tenant_id);
      const room = tenant ? this.rooms.find(r => r.room_id === tenant.room_id) : undefined;
      
      // Find the most recent active log (checked in but not checked out)
      // Or the most recent log if none are active
      const visitorLogs = this.visitorLogs.filter(l => l.visitor_id === visitor.visitor_id);
      let log: VisitorLog | undefined;
      
      if (visitorLogs.length > 0) {
        // First, try to find an active log (checked in but not checked out)
        const activeLogs = visitorLogs.filter(l => l.check_in_time && !l.check_out_time);
        
        if (activeLogs.length > 0) {
          // If there are active logs, get the most recent one by check_in_time
          log = activeLogs.sort((a, b) => 
            new Date(b.check_in_time!).getTime() - new Date(a.check_in_time!).getTime()
          )[0];
        } else {
          // If no active logs, get the most recent completed log
          log = visitorLogs.sort((a, b) => {
            const timeA = a.check_in_time ? new Date(a.check_in_time).getTime() : 0;
            const timeB = b.check_in_time ? new Date(b.check_in_time).getTime() : 0;
            return timeB - timeA;
          })[0];
        }
      }

      return {
        ...visitor,
        tenant_name: tenant?.full_name || 'Unknown',
        tenant_room_number: room?.room_number || 'N/A',
        tenant_contact: tenant?.contact_number || 'N/A',
        log,
      };
    });

    this.cache.allVisitorsWithDetails = result;
    this.cache.lastCacheTime = currentTime;
    return result;
  }

  getTenantWithRoom(tenantId: number): TenantWithRoom | undefined {
    const tenant = this.tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) return undefined;
    
    const room = this.rooms.find(r => r.room_id === tenant.room_id);
    return {
      ...tenant,
      room_number: room?.room_number || 'N/A',
      room_capacity: room?.capacity || 0,
      room_current_occupants: room?.current_occupants || 0,
    };
  }
}

// Export singleton instance
export const dataStore = new DataStore();