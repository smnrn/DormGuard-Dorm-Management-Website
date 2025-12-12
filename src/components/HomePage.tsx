import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Shield,
  Users,
  UserCheck,
  Clock,
  Lock,
  FileCheck,
  BarChart3,
  ChevronRight,
  Headphones,
  Building2,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface HomePageProps {
  onNavigateToLogin: () => void;
}

// Animated Counter Component
function AnimatedCounter({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        
        setCount(Math.floor(progress * end));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, end, duration]);

  return <span ref={ref} className="text-5xl">{count}{suffix}</span>;
}

// Section wrapper with fade-in animation
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

export function HomePage({ onNavigateToLogin }: HomePageProps) {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  const features = [
    {
      icon: Lock,
      title: "Secure Authentication",
      description:
        "Role-based access for administrators, help desk staff, and tenants",
    },
    {
      icon: Users,
      title: "Tenant Management",
      description:
        "Comprehensive profile management and room assignments",
    },
    {
      icon: UserCheck,
      title: "Visitor Pre-Registration",
      description:
        "Tenants can register visitors online for quick approval",
    },
    {
      icon: FileCheck,
      title: "Approval Workflow",
      description:
        "Administrators review and approve visitor requests",
    },
    {
      icon: Clock,
      title: "Check-In/Check-Out",
      description:
        "Help desk staff manage visitor entry and exit with timestamped records",
    },
    {
      icon: BarChart3,
      title: "Visit Logs & Reports",
      description:
        "Searchable logs of all visitor entries and exits",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav 
        className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-900 text-white sticky top-0 z-50 shadow-lg backdrop-blur-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl">DormGuard</span>
            </motion.div>
            <div className="hidden md:flex items-center gap-8">
              {["home", "about", "features", "contact"].map((section) => (
                <motion.button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="hover:text-cyan-300 transition-colors capitalize"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {section === "home" ? "Home" : section === "about" ? "About Us" : section === "features" ? "Features" : "Contact"}
                </motion.button>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onNavigateToLogin}
                className="bg-white text-blue-900 hover:bg-blue-50 transition-all"
              >
                Sign In
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 overflow-hidden"
      >
        {/* Animated Decorative Elements */}
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div 
                className="inline-block"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  All-in-One Solution
                </div>
              </motion.div>
              <motion.h1 
                className="text-slate-900 text-5xl lg:text-6xl leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Dormitory Visitor
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  Management System
                </span>
              </motion.h1>
              <motion.p 
                className="text-slate-600 text-lg leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                DormGuard streamlines visitor registration,
                approval workflows, and check-in/check-out
                processes for dormitories. Enhance security with
                digital visitor tracking, pre-registration, and
                comprehensive audit logs—all from one integrated
                platform.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onNavigateToLogin}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 px-8 gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Started
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all"
                    onClick={() => scrollToSection("features")}
                  >
                    Learn More
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div 
                className="flex items-center gap-8 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div>
                  <div className="flex items-center gap-1 text-slate-900 text-2xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <span>98%</span>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Satisfaction Rate
                  </p>
                </div>
                <div className="w-px h-12 bg-slate-300"></div>
                <div>
                  <div className="flex items-center gap-1 text-slate-900 text-2xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <span>500+</span>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Institutions
                  </p>
                </div>
              </motion.div>
            </div>
            <motion.div 
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl blur-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <img
                src="https://images.unsplash.com/photo-1721657197499-5c12825c3a11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Student Housing"
                className="relative rounded-3xl shadow-2xl object-cover w-full h-[500px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section
        id="about"
        className="py-24 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <FadeInSection>
              <div className="text-center mb-12">
                <h2 className="text-slate-900 text-4xl mb-4">
                  About DormGuard
                </h2>
                <p className="text-slate-600 text-lg">
                  Revolutionizing dormitory security and visitor
                  management for educational institutions
                  worldwide
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <motion.div 
                className="bg-white rounded-3xl shadow-xl p-10 mb-8"
                whileHover={{ y: -5, shadow: "2xl" }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-slate-900 text-2xl mb-4">
                  Our Mission
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  At DormGuard, our mission is to create safer,
                  more efficient dormitory environments through
                  innovative technology. We believe that student
                  housing should provide not just shelter, but a
                  secure, well-managed community where students
                  can focus on their academic success.
                </p>

                <h3 className="text-slate-900 text-2xl mb-4">
                  Why Choose DormGuard?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {[
                    { icon: Shield, title: "Enhanced Security", description: "Real-time visitor tracking and approval workflows ensure only authorized individuals enter your facilities." },
                    { icon: Clock, title: "Time Efficiency", description: "Streamline check-in processes and reduce wait times with our digital pre-registration system." },
                    { icon: Users, title: "Student Convenience", description: "Tenants can pre-register visitors online, making the process seamless for everyone involved." },
                    { icon: BarChart3, title: "Data & Insights", description: "Comprehensive logging and reporting help administrators make informed decisions." }
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div 
                        key={item.title}
                        className="flex gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-slate-900 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-slate-600 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <h3 className="text-slate-900 text-2xl mb-4">
                  Our Commitment
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  We're committed to continuous improvement and
                  exceptional support. Our team works closely with
                  educational institutions to understand their
                  unique needs and deliver solutions that truly
                  make a difference. With DormGuard, you're not
                  just getting software – you're getting a partner
                  dedicated to your success.
                </p>
              </motion.div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-slate-900 text-4xl mb-4">
                Comprehensive Visitor Management
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                DormGuard streamlines visitor tracking,
                pre-registration, and security operations while
                enhancing the dormitory experience for students
              </p>
            </div>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="group bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-2xl p-8 cursor-pointer"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    borderColor: "rgb(147, 197, 253)",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                  }}
                >
                  <motion.div 
                    className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-5 shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-slate-900 text-xl mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 text-white">
        <div className="container mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl mb-4">
                Trusted by Leading Institutions
              </h2>
              <p className="text-blue-200 text-lg">
                Join hundreds of universities and colleges using
                DormGuard
              </p>
            </div>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: "+", label: "Institutions", index: 0 },
              { value: 100, suffix: "K+", label: "Active Students", index: 1 },
              { value: 98, suffix: "%", label: "Satisfaction Rate", index: 2 },
              { value: 24, suffix: "/7", label: "Support Available", index: 3, noAnimate: true },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                className="text-center p-6"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: stat.index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                {stat.noAnimate ? (
                  <div className="text-5xl mb-3">{stat.value}{stat.suffix}</div>
                ) : (
                  <div className="mb-3">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                )}
                <p className="text-blue-200">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-6 text-center">
          <FadeInSection>
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-slate-900 text-4xl">
                Ready to Transform Your Dormitory Management?
              </h2>
              <p className="text-slate-600 text-lg">
                Join leading institutions in modernizing student
                housing operations with our comprehensive
                platform.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onNavigateToLogin}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 px-10 gap-2 shadow-lg text-lg hover:shadow-xl transition-all"
                >
                  Request a Demo
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-slate-900 text-4xl mb-4">
                Contact Us
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Have questions or need assistance? Fill out the
                form below and we'll get back to you soon.
              </p>
            </div>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FadeInSection delay={0.2}>
              <div className="space-y-4">
                {[
                  { icon: Mail, text: "dormguard@univ.com" },
                  { icon: Phone, text: "(+63)931 456-7898" },
                  { icon: MapPin, text: "España Blvd, Sampaloc, Manila, 1015 Metro Manila, Philippines" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div 
                      key={index}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ x: 10 }}
                    >
                      <Icon className="w-6 h-6 text-blue-600" />
                      <p className="text-slate-600">{item.text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </FadeInSection>
            <FadeInSection delay={0.3}>
              <form
                onSubmit={handleContactSubmit}
                className="space-y-4"
              >
                <motion.div className="space-y-2" whileFocus={{ scale: 1.02 }}>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div className="space-y-2" whileFocus={{ scale: 1.02 }}>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div className="space-y-2" whileFocus={{ scale: 1.02 }}>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        subject: e.target.value,
                      })
                    }
                    className="w-full transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div className="space-y-2" whileFocus={{ scale: 1.02 }}>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        message: e.target.value,
                      })
                    }
                    className="w-full transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 px-10 gap-2 shadow-lg text-lg w-full transition-all hover:shadow-xl"
                  >
                    Send Message
                    <Send className="w-5 h-5" />
                  </Button>
                </motion.div>
                {submitted && (
                  <motion.div 
                    className="flex items-center gap-2 text-green-600 justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <p>Message sent successfully!</p>
                  </motion.div>
                )}
              </form>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl">
                DormGuard
              </span>
            </motion.div>
            <p className="text-sm">
              © 2025 DormGuard System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
