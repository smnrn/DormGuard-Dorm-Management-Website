import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { UserData } from '../../App';
import { Calendar as CalendarIcon, UserPlus, User, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { dataStore } from '../../lib/dataStore';
import { validateTwelveHourNotice, getMinimumVisitDate } from '../../lib/dateUtils';
import { useRealTimeSync } from '../../hooks/useRealTimeSync';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { Alert, AlertDescription } from '../ui/alert';

interface TenantRegisterVisitorProps {
  user: UserData;
}

export function TenantRegisterVisitor({ user }: TenantRegisterVisitorProps) {
  const [tenant, setTenant] = useState<any>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [tenantLoadError, setTenantLoadError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  // Real-time sync hook
  const { isSyncing, lastSyncTime, syncError, refresh } = useRealTimeSync({
    enabled: true,
    interval: 5000, // Sync every 5 seconds
  });

  // Load tenant data on mount
  useEffect(() => {
    const loadTenantData = async () => {
      setIsLoadingTenant(true);
      setTenantLoadError(null);
      try {
        console.log('[TenantRegisterVisitor] Loading tenant profile for username:', user.username);
        
        // Use tenant-specific profile endpoint instead of getAllTenants
        const response = await fetch('http://localhost:5000/api/tenant/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Failed to load tenant profile');
        }
        
        const data = await response.json();
        const tenantData = data.data || data;
        
        console.log('[TenantRegisterVisitor] Loaded tenant profile:', tenantData);
        
        if (!tenantData) {
          setTenantLoadError(`No tenant record found for username: ${user.username}. Please contact your administrator.`);
        }
        setTenant(tenantData);
      } catch (error: any) {
        console.error('Failed to load tenant data:', error);
        setTenantLoadError(`Failed to load tenant information: ${error.message}`);
      } finally {
        setIsLoadingTenant(false);
      }
    };
    
    loadTenantData();
  }, [user.username]);

  const [formData, setFormData] = useState({
    visitor_name: '',
    contact_number: '',
    purpose: '',
    visit_date: '',
    visit_time: '',
  });

  // Real-time validation whenever date/time changes
  useEffect(() => {
    if (formData.visit_date && formData.visit_time) {
      const validation = validateTwelveHourNotice(formData.visit_date, formData.visit_time);
      if (!validation.isValid) {
        setValidationError(validation.message);
        setValidationSuccess(null);
      } else {
        setValidationError(null);
        setValidationSuccess(validation.message);
      }
    } else if (formData.visit_date) {
      const validation = validateTwelveHourNotice(formData.visit_date);
      if (!validation.isValid) {
        setValidationError(validation.message);
        setValidationSuccess(null);
      } else {
        setValidationError(null);
        setValidationSuccess(validation.message);
      }
    } else {
      setValidationError(null);
      setValidationSuccess(null);
    }
  }, [formData.visit_date, formData.visit_time]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.visitor_name.trim()) {
      alert('Please enter visitor name');
      return;
    }
    
    if (!formData.contact_number.trim()) {
      alert('Please enter contact number');
      return;
    }
    
    if (!formData.purpose.trim()) {
      alert('Please enter purpose of visit');
      return;
    }
    
    if (!formData.visit_date) {
      alert('Please select a visit date');
      return;
    }
    
    if (!formData.visit_time) {
      alert('Please select a visit time');
      return;
    }
    
    if (!tenant) {
      alert('Tenant information not found');
      return;
    }

    // Final validation before submission
    const validation = validateTwelveHourNotice(formData.visit_date, formData.visit_time);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass data with correct field names that match the Visitor interface
      await dataStore.addVisitor({
        full_name: formData.visitor_name,
        contact_number: formData.contact_number,
        purpose: formData.purpose,
        expected_date: formData.visit_date,
        expected_time: formData.visit_time,
        tenant_id: tenant.tenant_id,
        approval_status: 'Pending',
        created_at: new Date().toISOString(),
      });

      alert('Visitor registration submitted for approval! You will be notified once it is reviewed by an administrator.');
      
      // Reset form
      setFormData({
        visitor_name: '',
        contact_number: '',
        purpose: '',
        visit_date: '',
        visit_time: '',
      });

      // Force immediate refresh
      await refresh();
    } catch (error: any) {
      alert('Failed to register visitor: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-slate-900 text-2xl mb-2">Pre-Register Visitor</h2>
          <p className="text-slate-600">
            Submit a visitor request providing the visitor's name and date of visit
          </p>
        </div>
        {/* Real-time Sync Indicator */}
        <SyncStatusIndicator
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          onRefresh={refresh}
        />
      </div>

      {/* Real-time Validation Alerts */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      {validationSuccess && formData.visit_date && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{validationSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Visitor Details */}
                <div className="space-y-4">
                  <h3 className="text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Visitor Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitor_name">Full Name *</Label>
                      <Input
                        id="visitor_name"
                        name="visitor_name"
                        value={formData.visitor_name}
                        onChange={handleChange}
                        placeholder="Enter visitor's full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_number">Contact Number *</Label>
                      <Input
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="Enter visitor's contact number"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose of Visit *</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        placeholder="Describe the reason for the visit..."
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Visit Details */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h3 className="text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                    Visit Details
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="visit_date" className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-green-600" />
                      Expected Date *
                    </Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full justify-start text-left h-10 ${
                            !formData.visit_date && 'text-slate-500'
                          }`}
                          onClick={() => setDatePickerOpen(true)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.visit_date 
                            ? format(new Date(formData.visit_date), 'PPP') 
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.visit_date ? new Date(formData.visit_date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({
                                ...formData,
                                visit_date: format(date, 'yyyy-MM-dd'),
                              });
                              setDatePickerOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            // Only disable dates that are definitely in the past
                            // Allow any date from today onwards
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            return checkDate < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visit_time" className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Expected Time *
                      </Label>
                      <div className="relative">
                        <Input
                          id="visit_time"
                          name="visit_time"
                          type="time"
                          value={formData.visit_time}
                          onChange={handleChange}
                          className="h-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-500">When the visitor will arrive</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex-1 gap-2"
                    disabled={isSubmitting || !!validationError}
                  >
                    <UserPlus className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFormData({
                        visitor_name: '',
                        contact_number: '',
                        purpose: '',
                        visit_date: '',
                        visit_time: '',
                      });
                    }}
                  >
                    Clear Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-blue-900 mb-3">Registration Process</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <p className="text-blue-900 text-sm">Submit Request</p>
                    <p className="text-blue-700 text-xs">Fill out visitor information</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <p className="text-blue-900 text-sm">Admin Approval</p>
                    <p className="text-blue-700 text-xs">Dorm staff reviews your request</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <p className="text-blue-900 text-sm">Receive Pass Code</p>
                    <p className="text-blue-700 text-xs">Digital pass generated upon approval</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                    4
                  </div>
                  <div>
                    <p className="text-blue-900 text-sm">Visitor Check-In</p>
                    <p className="text-blue-700 text-xs">Help desk staff verifies at entrance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-slate-900 mb-3">Important Notes</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Submit requests at least 12 hours in advance</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Accurate ID information is required for security</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Visitors must check in/out at the help desk</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>You'll be notified once approved or if additional info is needed</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}