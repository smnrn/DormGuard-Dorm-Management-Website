import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { User, Mail, Phone, Camera, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Upload, Cloud } from 'lucide-react';
import { UserData } from '../../App';
import { uploadToGoogleDrive, convertToViewableLink, isGoogleDriveConfigured, initGoogleDrive } from '../../utils/googleDrive';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const USE_GOOGLE_DRIVE = import.meta.env.VITE_USE_GOOGLE_DRIVE === 'true';

interface TenantProfileProps {
  user: UserData;
}

export function TenantProfile({ user }: TenantProfileProps) {
  const [profileImage, setProfileImage] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [imageMessage, setImageMessage] = useState('');
  const [driveInitialized, setDriveInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Additional user details from database
  const [userDetails, setUserDetails] = useState<{
    email: string;
    contact_number: string;
  } | null>(null);

  // Initialize Google Drive on component mount if enabled
  useEffect(() => {
    if (USE_GOOGLE_DRIVE && isGoogleDriveConfigured()) {
      initGoogleDrive()
        .then(() => setDriveInitialized(true))
        .catch(err => console.error('Failed to initialize Google Drive:', err));
    }
  }, []);

  // Load existing profile image and user details on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/tenants/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const tenantData = data.data;
          
          // Load profile image
          if (tenantData?.profile_image) {
            // Convert Drive link to viewable format if it's a Drive link
            const imageUrl = tenantData.profile_image.includes('drive.google.com') 
              ? convertToViewableLink(tenantData.profile_image)
              : tenantData.profile_image;
            setProfileImage(imageUrl);
          }
          
          // Load additional user details (email, phone)
          setUserDetails({
            email: tenantData?.email || '',
            contact_number: tenantData?.contact_number || ''
          });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [user.id]);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageMessage('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for Drive, 2MB for base64)
    const maxSize = USE_GOOGLE_DRIVE ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageMessage(`Image size must be less than ${USE_GOOGLE_DRIVE ? '5MB' : '2MB'}`);
      return;
    }

    setUploading(true);
    setImageMessage('Uploading...');

    try {
      let imageUrl = '';
      let driveLink = '';

      if (USE_GOOGLE_DRIVE && isGoogleDriveConfigured()) {
        // Upload to Google Drive
        setImageMessage('Uploading to Google Drive...');
        
        const result = await uploadToGoogleDrive(file, `profile_${user.id}_${Date.now()}.${file.name.split('.').pop()}`);
        
        imageUrl = result.viewableLink; // Direct viewable link for display
        driveLink = result.link; // Shareable link for database
        
        setProfileImage(imageUrl);
        setImageMessage('Saving to database...');

        // Save Drive link to database
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/tenants/${user.id}/profile-image`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            profile_image_url: driveLink, // Store the shareable link
            storage_type: 'google_drive'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save image link');
        }

        setImageMessage('Profile image updated successfully! ✓');
        setTimeout(() => setImageMessage(''), 3000);
      } else {
        // Fallback to base64 storage
        setImageMessage('Converting image...');
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          setProfileImage(base64String);

          setImageMessage('Saving to database...');

          // Upload to server
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/api/tenants/${user.id}/profile-image`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              profile_image: base64String,
              storage_type: 'base64'
            })
          });

          if (response.ok) {
            setImageMessage('Profile image updated successfully! ✓');
            setTimeout(() => setImageMessage(''), 3000);
          } else {
            throw new Error('Failed to upload image');
          }
        };

        reader.onerror = () => {
          setImageMessage('Failed to read image file');
        };

        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setImageMessage('Failed to upload image. Please try again.');
      setTimeout(() => setImageMessage(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong';
    return 'medium';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPasswordForm({ ...passwordForm, newPassword });
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/tenants/${user.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength(null);
        
        // Hide form after 2 seconds
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordMessage(null);
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 'weak') return 'bg-red-500';
    if (passwordStrength === 'medium') return 'bg-yellow-500';
    if (passwordStrength === 'strong') return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getStrengthText = () => {
    if (passwordStrength === 'weak') return 'Weak';
    if (passwordStrength === 'medium') return 'Medium';
    if (passwordStrength === 'strong') return 'Strong';
    return '';
  };

  const displayName = user.fullName || user.username;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-slate-900 text-xl mb-6">My Profile</h2>
        
        {/* Profile Image Section */}
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-lg">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            <button
              onClick={handleImageClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors disabled:bg-slate-400"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-slate-900 text-xl mb-2">{displayName}</h3>
            <p className="text-slate-600 mb-4">{user.username}</p>
            {imageMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  imageMessage.includes('success') || imageMessage.includes('✓')
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : imageMessage.includes('Failed') || imageMessage.includes('Error')
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                {uploading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                {imageMessage}
              </motion.div>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
              {USE_GOOGLE_DRIVE && isGoogleDriveConfigured() ? (
                <>
                  <Cloud className="w-4 h-4 text-green-600" />
                  <span>Upload to Google Drive (max 5MB)</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload profile picture (max 2MB)</span>
                </>
              )}
            </div>
            {USE_GOOGLE_DRIVE && !isGoogleDriveConfigured() && (
              <p className="text-orange-600 text-xs mt-2">
                ⚠️ Google Drive not configured. Using local storage.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-sm">Full Name</p>
              <p className="text-slate-900">{displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-sm">Email</p>
              <p className="text-slate-900">{userDetails?.email || 'Not provided'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-sm">Contact Number</p>
              <p className="text-slate-900">{userDetails?.contact_number || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Information */}
      {(user.building || user.room) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Room Assignment</h3>
          <div className="space-y-2">
            {user.building && (
              <div>
                <p className="text-slate-500 text-sm">Building</p>
                <p className="text-slate-900">{user.building}</p>
              </div>
            )}
            {user.room && (
              <div>
                <p className="text-slate-500 text-sm">Room Number</p>
                <p className="text-slate-900">{user.room}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Security */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900">Account Security</h3>
          {!showPasswordForm && (
            <Button
              onClick={() => setShowPasswordForm(true)}
              className="gap-2"
              variant="outline"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          )}
        </div>

        {!showPasswordForm ? (
          <p className="text-slate-600 text-sm">
            Keep your account secure by regularly updating your password
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter current password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter new password (min. 6 characters)"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ 
                            width: passwordStrength === 'weak' ? '33%' : 
                                   passwordStrength === 'medium' ? '66%' : '100%' 
                          }}
                        />
                      </div>
                      <span className={`text-sm ${
                        passwordStrength === 'weak' ? 'text-red-600' :
                        passwordStrength === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Tip: Use 10+ characters with uppercase, numbers for strong password
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Re-enter new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
                {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Passwords match
                  </p>
                )}
              </div>

              {/* Message */}
              {passwordMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-lg flex items-start gap-2 ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    passwordMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {passwordMessage.text}
                  </p>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordMessage(null);
                    setPasswordStrength(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
              </div>

              {/* Password Tips */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm text-green-900 mb-2">Password Security Tips:</h4>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• Use at least 6 characters (10+ recommended)</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Add numbers and special characters</li>
                  <li>• Avoid using personal information</li>
                  <li>• Don't reuse passwords from other accounts</li>
                </ul>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}