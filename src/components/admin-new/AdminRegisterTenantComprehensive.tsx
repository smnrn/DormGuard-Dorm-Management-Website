import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Room } from '../../lib/types';
import { 
  UserPlus, Home, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, Camera, Upload, X,
  User, Mail, Phone, MapPin, IdCard, GraduationCap, Users, Calendar, ChevronRight, ChevronLeft
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import { dataStore } from '../../lib/dataStore';
import { useRealTimeSync } from '../../hooks/useRealTimeSync';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { uploadToGoogleDrive, convertToViewableLink, isGoogleDriveConfigured, initGoogleDrive } from '../../utils/googleDrive';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const USE_GOOGLE_DRIVE = import.meta.env.VITE_USE_GOOGLE_DRIVE === 'true';

interface FormData {
  // Account Credentials
  username: string;
  password: string;
  
  // Basic Personal Information
  full_name: string;
  email: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  
  // Identification
  id_type: string;
  id_number: string;
  
  // Academic/Professional Information
  occupation: string;
  institution_name: string;
  student_id: string;
  year_level: string;
  course_program: string;
  
  // Address Information
  permanent_address: string;
  city: string;
  province_state: string;
  postal_code: string;
  country: string;
  
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_relationship: string;
  emergency_contact_address: string;
  
  // Guardian Information
  guardian_name: string;
  guardian_contact: string;
  guardian_relationship: string;
  guardian_address: string;
  
  // Dormitory Information
  room_id: string;
  move_in_date: string;
  expected_move_out_date: string;
  lease_duration_months: string;
}

export function AdminRegisterTenantComprehensive() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    full_name: '',
    email: '',
    contact_number: '',
    date_of_birth: '',
    gender: '',
    nationality: 'Filipino',
    id_type: '',
    id_number: '',
    occupation: '',
    institution_name: '',
    student_id: '',
    year_level: '',
    course_program: '',
    permanent_address: '',
    city: '',
    province_state: '',
    postal_code: '',
    country: 'Philippines',
    emergency_contact_name: '',
    emergency_contact_number: '',
    emergency_contact_relationship: '',
    emergency_contact_address: '',
    guardian_name: '',
    guardian_contact: '',
    guardian_relationship: '',
    guardian_address: '',
    room_id: '',
    move_in_date: new Date().toISOString().split('T')[0],
    expected_move_out_date: '',
    lease_duration_months: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [tenantCount, setTenantCount] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Image State
  const [profileImage, setProfileImage] = useState<string>('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driveInitialized, setDriveInitialized] = useState(false);

  useEffect(() => {
    if (USE_GOOGLE_DRIVE && isGoogleDriveConfigured()) {
      initGoogleDrive()
        .then(() => setDriveInitialized(true))
        .catch(err => console.error('Failed to initialize Google Drive:', err));
    }
  }, []);

  const { isSyncing, lastSyncTime, syncError, refresh } = useRealTimeSync({
    enabled: true,
    interval: 5000,
    onSync: async () => {
      try {
        const [rooms, tenants] = await Promise.all([
          adminAPI.getRooms(),
          adminAPI.getTenants()
        ]);
        
        setAllRooms(rooms);
        let filteredRooms = rooms.filter(room => room.current_occupants < room.capacity);
        
        if (selectedBuilding !== 'all') {
          const buildingLetter = selectedBuilding.replace('Building ', '').trim();
          filteredRooms = filteredRooms.filter(room => 
            room.building?.toUpperCase() === buildingLetter.toUpperCase()
          );
        }
        
        setAvailableRooms(filteredRooms);
        setTotalRooms(rooms.length);
        setTenantCount(tenants.length);
      } catch (error) {
        console.error('Failed to sync data:', error);
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrorMessage('');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageMessage('Please select an image file');
      return;
    }

    const maxSize = USE_GOOGLE_DRIVE ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageMessage(`Image size must be less than ${USE_GOOGLE_DRIVE ? '5MB' : '2MB'}`);
      return;
    }

    setProfileImageFile(file);
    setImageMessage('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setProfileImage('');
    setProfileImageFile(null);
    setImageMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateUsername = () => {
    const nameParts = formData.full_name.toLowerCase().split(' ');
    if (nameParts.length >= 2) {
      const suggested = nameParts[0].charAt(0) + nameParts[nameParts.length - 1];
      setFormData({ ...formData, username: suggested });
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        if (!formData.full_name.trim()) {
          setErrorMessage('Full name is required');
          return false;
        }
        if (!formData.email.includes('@')) {
          setErrorMessage('Valid email is required');
          return false;
        }
        if (!formData.contact_number.trim()) {
          setErrorMessage('Contact number is required');
          return false;
        }
        return true;
      
      case 2: // Account Credentials
        if (!formData.username.trim()) {
          setErrorMessage('Username is required');
          return false;
        }
        if (!formData.password || formData.password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
          return false;
        }
        return true;
      
      case 6: // Room Assignment
        if (!formData.room_id) {
          setErrorMessage('Please select a room');
          return false;
        }
        return true;
      
      default:
        return true; // Other steps are optional
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
      setErrorMessage('');
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setImageMessage('Registering tenant...');

    try {
      const selectedRoom = availableRooms.find(r => r.room_id.toString() === formData.room_id);
      
      // Handle profile image upload FIRST (if using Google Drive)
      let profileImageUrl = '';
      if (profileImageFile) {
        try {
          if (USE_GOOGLE_DRIVE && isGoogleDriveConfigured() && driveInitialized) {
            setImageMessage('Uploading profile image to Google Drive...');
            console.log('🖼️ Uploading profile image to Google Drive...');
            console.log('   File:', profileImageFile.name, `(${(profileImageFile.size / 1024).toFixed(2)} KB)`);
            
            const result = await uploadToGoogleDrive(
              profileImageFile, 
              `profile_temp_${Date.now()}.${profileImageFile.name.split('.').pop()}`
            );
            profileImageUrl = result.link; // Store the Drive link
            
            console.log('✅ Image uploaded to Google Drive');
            console.log('   Link:', profileImageUrl);
          } else {
            profileImageUrl = profileImage; // Use base64
            console.log('🖼️ Using base64 image (Google Drive not configured)');
            console.log('   Length:', profileImage.length, 'characters');
          }
        } catch (error) {
          console.error('❌ Profile image upload failed:', error);
          setImageMessage('Warning: Profile image upload failed, continuing registration...');
        }
      }
      
      setImageMessage('Registering tenant...');
      console.log('📝 Preparing tenant registration...');
      
      // Prepare data
      const tenantData: any = {
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email,
        contact_number: formData.contact_number,
        room_id: parseInt(formData.room_id),
        move_in_date: formData.move_in_date,
      };
      
      // Add profile image if available
      if (profileImageUrl) {
        tenantData.profile_image = profileImageUrl;
        console.log('✅ Profile image INCLUDED in registration payload');
      } else {
        console.log('⚠️  No profile image - registering tenant without image');
      }

      // Add optional fields only if they have values
      if (formData.date_of_birth) tenantData.date_of_birth = formData.date_of_birth;
      if (formData.gender) tenantData.gender = formData.gender;
      if (formData.nationality) tenantData.nationality = formData.nationality;
      if (formData.id_type) tenantData.id_type = formData.id_type;
      if (formData.id_number) tenantData.id_number = formData.id_number;
      if (formData.occupation) tenantData.occupation = formData.occupation;
      if (formData.institution_name) tenantData.institution_name = formData.institution_name;
      if (formData.student_id) tenantData.student_id = formData.student_id;
      if (formData.year_level) tenantData.year_level = formData.year_level;
      if (formData.course_program) tenantData.course_program = formData.course_program;
      if (formData.permanent_address) tenantData.permanent_address = formData.permanent_address;
      if (formData.city) tenantData.city = formData.city;
      if (formData.province_state) tenantData.province_state = formData.province_state;
      if (formData.postal_code) tenantData.postal_code = formData.postal_code;
      if (formData.country) tenantData.country = formData.country;
      if (formData.emergency_contact_name) tenantData.emergency_contact_name = formData.emergency_contact_name;
      if (formData.emergency_contact_number) tenantData.emergency_contact_number = formData.emergency_contact_number;
      if (formData.emergency_contact_relationship) tenantData.emergency_contact_relationship = formData.emergency_contact_relationship;
      if (formData.emergency_contact_address) tenantData.emergency_contact_address = formData.emergency_contact_address;
      if (formData.guardian_name) tenantData.guardian_name = formData.guardian_name;
      if (formData.guardian_contact) tenantData.guardian_contact = formData.guardian_contact;
      if (formData.guardian_relationship) tenantData.guardian_relationship = formData.guardian_relationship;
      if (formData.guardian_address) tenantData.guardian_address = formData.guardian_address;
      if (formData.expected_move_out_date) tenantData.expected_move_out_date = formData.expected_move_out_date;
      if (formData.lease_duration_months) tenantData.lease_duration_months = parseInt(formData.lease_duration_months);

      // Register tenant
      const response = await adminAPI.registerTenant(tenantData);
      const newTenantId = response.tenantId;

      console.log('🎉 Registration completed successfully!');
      console.log('   ├─ New Tenant ID:', newTenantId);
      console.log('   ├─ Name:', formData.full_name);
      console.log('   └─ Profile Image:', profileImageUrl ? 'INCLUDED ✓' : 'NOT INCLUDED');

      // Refresh data
      await dataStore.refreshAll();
      const tenants = await adminAPI.getTenants();
      setTenantCount(tenants.length);
      
      const rooms = await adminAPI.getRooms();
      setAllRooms(rooms);
      const available = rooms.filter(room => room.current_occupants < room.capacity);
      setAvailableRooms(available);
      setTotalRooms(rooms.length);

      setSuccessMessage(
        `✅ Tenant registered successfully!\n\n` +
        `👤 Name: ${formData.full_name}\n` +
        `🔑 Username: ${formData.username}\n` +
        `🔐 Password: ${formData.password}\n` +
        `🏠 Room: ${selectedRoom?.room_number}\n\n` +
        `⚠️ Please share credentials with the tenant securely.`
      );

      // Reset form
      setTimeout(() => {
        setFormData({
          username: '',
          password: '',
          full_name: '',
          email: '',
          contact_number: '',
          date_of_birth: '',
          gender: '',
          nationality: 'Filipino',
          id_type: '',
          id_number: '',
          occupation: '',
          institution_name: '',
          student_id: '',
          year_level: '',
          course_program: '',
          permanent_address: '',
          city: '',
          province_state: '',
          postal_code: '',
          country: 'Philippines',
          emergency_contact_name: '',
          emergency_contact_number: '',
          emergency_contact_relationship: '',
          emergency_contact_address: '',
          guardian_name: '',
          guardian_contact: '',
          guardian_relationship: '',
          guardian_address: '',
          room_id: '',
          move_in_date: new Date().toISOString().split('T')[0],
          expected_move_out_date: '',
          lease_duration_months: '',
        });
        clearImage();
        setSuccessMessage('');
        setImageMessage('');
        setCurrentStep(1);
      }, 15000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to register tenant');
      setImageMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildingFilterChange = (value: string) => {
    setSelectedBuilding(value);
    setFormData({ ...formData, room_id: '' });

    if (value === 'all') {
      const available = allRooms.filter(room => room.current_occupants < room.capacity);
      setAvailableRooms(available);
    } else {
      const buildingLetter = value.replace('Building ', '').trim();
      const filtered = allRooms.filter(room => {
        const matchesBuilding = room.building?.toUpperCase() === buildingLetter.toUpperCase();
        const isAvailable = room.current_occupants < room.capacity;
        return matchesBuilding && isAvailable;
      });
      setAvailableRooms(filtered);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Basic Info', icon: User },
      { num: 2, label: 'Credentials', icon: IdCard },
      { num: 3, label: 'Academic', icon: GraduationCap },
      { num: 4, label: 'Address', icon: MapPin },
      { num: 5, label: 'Emergency', icon: Users },
      { num: 6, label: 'Room', icon: Home },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          
          return (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${isActive ? 'bg-blue-600 text-white scale-110' : ''}
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                `}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Basic Personal Information
        return (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-4">
              <h3 className="text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Picture (Optional)
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profileImage ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
                      <img 
                        src={profileImage} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleImageClick}
                      className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-xs text-slate-500 group-hover:text-blue-600">Upload</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">
                    {profileImage ? 'Profile picture selected' : 'Add a profile picture'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Max size: {USE_GOOGLE_DRIVE ? '5MB (Google Drive)' : '2MB (Base64)'}
                  </p>
                  {imageMessage && (
                    <p className={`text-xs mt-1 ${imageMessage.includes('Warning') ? 'text-amber-600' : 'text-blue-600'}`}>
                      {imageMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan.delacruz@email.com"
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
                  placeholder="+63 912 345 6789"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="Filipino"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_type">ID Type</Label>
                <Select value={formData.id_type} onValueChange={(value) => handleSelectChange('id_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National ID">National ID</SelectItem>
                    <SelectItem value="Driver's License">Driver's License</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="Student ID">Student ID</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder="Enter ID number"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Account Credentials
        return (
          <div className="space-y-6">
            <h3 className="text-slate-900 flex items-center gap-2">
              <IdCard className="w-5 h-5" />
              Login Credentials
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="jdelacruz"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateUsername}
                    disabled={!formData.full_name}
                  >
                    Auto
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Tenant will use this to log in
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Minimum 6 characters
                </p>
              </div>
            </div>
          </div>
        );

      case 3: // Academic/Professional Information
        return (
          <div className="space-y-6">
            <h3 className="text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Academic / Professional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="Student / Professional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution_name">Institution / Company Name</Label>
                <Input
                  id="institution_name"
                  name="institution_name"
                  value={formData.institution_name}
                  onChange={handleChange}
                  placeholder="University of the Philippines"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_id">Student / Employee ID</Label>
                <Input
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="2024-12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year_level">Year Level / Position</Label>
                <Input
                  id="year_level"
                  name="year_level"
                  value={formData.year_level}
                  onChange={handleChange}
                  placeholder="3rd Year / Manager"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="course_program">Course / Program / Department</Label>
                <Input
                  id="course_program"
                  name="course_program"
                  value={formData.course_program}
                  onChange={handleChange}
                  placeholder="Bachelor of Science in Computer Science"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Address Information
        return (
          <div className="space-y-6">
            <h3 className="text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="permanent_address">Permanent Address</Label>
                <textarea
                  id="permanent_address"
                  name="permanent_address"
                  value={formData.permanent_address}
                  onChange={handleChange}
                  placeholder="Street, Barangay, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City / Municipality</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Quezon City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province_state">Province / State</Label>
                <Input
                  id="province_state"
                  name="province_state"
                  value={formData.province_state}
                  onChange={handleChange}
                  placeholder="Metro Manila"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="1100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Philippines"
                />
              </div>
            </div>
          </div>
        );

      case 5: // Emergency Contact & Guardian
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-slate-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                Emergency Contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Name</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Maria Dela Cruz"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_number">Contact Number</Label>
                  <Input
                    id="emergency_contact_number"
                    name="emergency_contact_number"
                    value={formData.emergency_contact_number}
                    onChange={handleChange}
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Input
                    id="emergency_contact_relationship"
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                    placeholder="Mother / Father / Spouse"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_address">Address</Label>
                  <Input
                    id="emergency_contact_address"
                    name="emergency_contact_address"
                    value={formData.emergency_contact_address}
                    onChange={handleChange}
                    placeholder="Contact address"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-slate-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                Guardian Information (Optional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Name</Label>
                  <Input
                    id="guardian_name"
                    name="guardian_name"
                    value={formData.guardian_name}
                    onChange={handleChange}
                    placeholder="Guardian name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_contact">Contact Number</Label>
                  <Input
                    id="guardian_contact"
                    name="guardian_contact"
                    value={formData.guardian_contact}
                    onChange={handleChange}
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_relationship">Relationship</Label>
                  <Input
                    id="guardian_relationship"
                    name="guardian_relationship"
                    value={formData.guardian_relationship}
                    onChange={handleChange}
                    placeholder="Parent / Legal Guardian"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_address">Address</Label>
                  <Input
                    id="guardian_address"
                    name="guardian_address"
                    value={formData.guardian_address}
                    onChange={handleChange}
                    placeholder="Guardian address"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Room Assignment
        return (
          <div className="space-y-6">
            <h3 className="text-slate-900 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Room Assignment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filter by Building</Label>
                <Select value={selectedBuilding} onValueChange={handleBuildingFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Buildings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buildings</SelectItem>
                    <SelectItem value="Building A">Building A</SelectItem>
                    <SelectItem value="Building B">Building B</SelectItem>
                    <SelectItem value="Building C">Building C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Room *</Label>
                <Select value={formData.room_id} onValueChange={(value) => handleSelectChange('room_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.room_id} value={room.room_id.toString()}>
                        {room.room_number} - {room.building} (
                        {room.capacity - room.current_occupants} bed{room.capacity - room.current_occupants !== 1 ? 's' : ''} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {availableRooms.length} rooms available
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="move_in_date">Move-in Date *</Label>
                <Input
                  id="move_in_date"
                  name="move_in_date"
                  type="date"
                  value={formData.move_in_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_move_out_date">Expected Move-out Date</Label>
                <Input
                  id="expected_move_out_date"
                  name="expected_move_out_date"
                  type="date"
                  value={formData.expected_move_out_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lease_duration_months">Lease Duration (Months)</Label>
                <Input
                  id="lease_duration_months"
                  name="lease_duration_months"
                  type="number"
                  value={formData.lease_duration_months}
                  onChange={handleChange}
                  placeholder="6"
                  min="1"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-slate-900 text-2xl mb-2">Register New Tenant</h2>
          <p className="text-slate-600">
            Complete comprehensive tenant registration (Step {currentStep} of {totalSteps})
          </p>
        </div>
        <SyncStatusIndicator
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          onRefresh={refresh}
        />
      </div>

      <AnimatePresence mode="wait">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-2 border-green-500 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-green-900 mb-2">Success!</h3>
                    <p className="text-green-800 text-sm whitespace-pre-line">{successMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-2 border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{errorMessage}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Registration Form</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register Tenant
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}