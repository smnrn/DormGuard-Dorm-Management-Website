import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Shield, LogIn, Lock, User, HelpCircle, Mail, Phone, Send, CheckCircle, Building2, ArrowLeft } from 'lucide-react';
import { UserData } from '../App';
import { login } from '../lib/auth';
import { dataStore } from '../lib/dataStore';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onLogin: (userData: UserData) => void;
  onBackToHome: () => void;
}

export function LoginPage({ onLogin, onBackToHome }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'Login Assistance',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Clear any existing session on mount
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      await dataStore.initialize();
      
      const userData: UserData = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name || user.username,
        email: user.email,
        phone: user.phone,
      };
      
      onLogin(userData);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate sending to administrator
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Contact request sent:', contactForm);
      
      setContactSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setContactSubmitted(false);
        setShowContactDialog(false);
        setContactForm({
          name: '',
          email: '',
          subject: 'Login Assistance',
          message: '',
        });
      }, 3000);
    } catch (err) {
      console.error('Contact form error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      {/* Left Side - Login Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative bg-white"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button - Top Left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={onBackToHome}
            className="absolute top-8 left-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-2 transition-all"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
        </motion.div>

        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <motion.div 
            className="space-y-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl text-slate-900">DormGuard</h1>
            </div>
            <h2 className="text-slate-900 text-3xl">Welcome Back</h2>
            <p className="text-slate-600">
              Sign in to access the dormitory visitor management system
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div 
              className="space-y-2"
              whileFocus={{ scale: 1.01 }}
            >
              <Label htmlFor="username" className="text-slate-700 text-sm">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors" />
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              whileFocus={{ scale: 1.01 }}
            >
              <Label htmlFor="password" className="text-slate-700 text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3"
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }
                  }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                >
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all gap-2 text-base rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div 
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Help Section */}
          <motion.div 
            className="pt-6 border-t border-slate-200"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-900 text-sm mb-1">Need help accessing your account?</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-2">
                  If you're having trouble logging in or forgot your credentials, our support team is here to help.
                </p>
                <motion.button
                  type="button"
                  onClick={() => setShowContactDialog(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm underline underline-offset-2 transition-colors"
                  whileHover={{ x: 5 }}
                >
                  Contact Administrator
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Footer Notice */}
          <motion.div 
            className="pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              🔒 Secure access for authorized personnel only.<br />
              All login activities are monitored and logged.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Visual */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 items-center justify-center p-16 relative overflow-hidden"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-lg">
          {/* Building Icon */}
          <motion.div 
            className="w-32 h-32 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-white/20"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Building2 className="w-16 h-16 text-white" />
          </motion.div>

          {/* Title */}
          <motion.div 
            className="space-y-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-white text-4xl">
              Secure Visitor<br />Management
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Streamline dormitory security with digital check-ins, pre-registration, and real-time tracking
            </p>
          </motion.div>

          {/* Features */}
          <motion.div 
            className="grid grid-cols-2 gap-4 pt-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {[
              { icon: Shield, label: "Enhanced Security" },
              { icon: CheckCircle, label: "Pre-Registration" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={feature.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white text-sm">{feature.label}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="flex justify-center gap-8 pt-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.1 }}
            >
              <div className="text-white text-3xl mb-1">500+</div>
              <p className="text-blue-200 text-xs">Institutions</p>
            </motion.div>
            <div className="w-px h-16 bg-white/20"></div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.1 }}
            >
              <div className="text-white text-3xl mb-1">98%</div>
              <p className="text-blue-200 text-xs">Satisfaction</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Contact Administrator Dialog */}
      <Dialog open={showContactDialog} onOpenChange={(open) => {
        setShowContactDialog(open);
        if (!open) {
          setContactSubmitted(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <motion.div 
              className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <HelpCircle className="w-7 h-7 text-white" />
            </motion.div>
            <DialogTitle className="text-2xl text-slate-900 text-center">Contact Support</DialogTitle>
            <DialogDescription className="text-slate-600 text-center">
              Send a message to the administrator for assistance
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {contactSubmitted ? (
              <motion.div 
                className="py-8 text-center space-y-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.div 
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <div>
                  <h3 className="text-slate-900 text-lg mb-2">Message Sent!</h3>
                  <p className="text-slate-600 text-sm">
                    Your request has been sent to the administrator.<br />
                    You'll receive a response shortly.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleContactSubmit} 
                className="space-y-4 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-slate-700 text-sm">
                    Your Name
                  </Label>
                  <Input
                    id="contact-name"
                    placeholder="John Doe"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-slate-700 text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="john@university.edu"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-slate-700 text-sm">
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Please describe your issue or question..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white resize-none transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <motion.div 
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Contact Information */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center space-y-1">
              <span className="flex items-center justify-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                support@dormguard.edu
              </span>
              <span className="flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                1-800-DORMGUARD
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}