import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface TenantChangePasswordProps {
  tenantId: number;
  onBack: () => void;
}

export function TenantChangePassword({ tenantId, onBack }: TenantChangePasswordProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong';
    return 'medium';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, newPassword });
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/tenants/${tenantId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength(null);
        
        // Auto redirect after 2 seconds
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-800">Change Password</h1>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password (min. 6 characters)"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
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
                  <p className="text-xs text-gray-500">
                    Tip: Use 10+ characters with uppercase, numbers for strong password
                  </p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Re-enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Passwords match
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Password Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm text-blue-900 mb-2">Password Security Tips:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use at least 6 characters (10+ recommended)</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Add numbers and special characters</li>
              <li>• Avoid using personal information</li>
              <li>• Don't reuse passwords from other accounts</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
