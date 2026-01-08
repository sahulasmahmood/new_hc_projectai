import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  Stethoscope, 
  ShieldCheck, 
  Menu,
  X,
  Calendar,
  Pill,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Star,
  Activity
} from 'lucide-react';
import AIAgentToggle from '@/components/ai/AIAgentToggle';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  React.useEffect(() => {
    document.title = "HealthCare - Smart Healthcare Management";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Smart healthcare management system for clinics and hospitals. Manage patients, appointments, billing, and more.");
    }
  }, []);

  const services = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Patient Records",
      description: "Secure digital records with complete medical history, prescriptions, and visit logs."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Appointment Scheduling",
      description: "Smart booking system with automated reminders and calendar integration."
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Billing Management",
      description: "Streamlined invoicing, payment tracking, and financial reporting."
    },
    {
      icon: <Pill className="h-6 w-6" />,
      title: "Inventory Control",
      description: "Track medical supplies and medications with automatic reorder alerts."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Digital Prescriptions",
      description: "Create and manage prescriptions with drug interaction checks."
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Data Security",
      description: "HIPAA compliant with encrypted storage and secure access controls."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Priya Sharma",
      role: "General Physician",
      clinic: "City Health Clinic",
      content: "This system has transformed how we manage our practice. Patient wait times have reduced significantly.",
      rating: 5
    },
    {
      name: "Dr. Rajesh Kumar",
      role: "Cardiologist",
      clinic: "Heart Care Hospital",
      content: "The appointment scheduling and patient history features are exactly what we needed. Highly recommended.",
      rating: 5
    },
    {
      name: "Dr. Anita Desai",
      role: "Pediatrician",
      clinic: "Children's Wellness Center",
      content: "Easy to use interface and excellent support team. Our staff adapted to it within days.",
      rating: 5
    }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">HealthCare</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#services" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Services</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Testimonials</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Contact</a>
              <div className="flex items-center gap-3 ml-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-medical-600 hover:bg-medical-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 text-gray-600"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <a href="#services" className="block py-2 text-gray-700 font-medium">Services</a>
              <a href="#features" className="block py-2 text-gray-700 font-medium">Features</a>
              <a href="#testimonials" className="block py-2 text-gray-700 font-medium">Testimonials</a>
              <a href="#contact" className="block py-2 text-gray-700 font-medium">Contact</a>
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/signup" className="block">
                  <Button className="w-full bg-medical-600 hover:bg-medical-700 text-white">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-50 text-medical-700 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Healthcare Management Solution
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Simplify Your
                <span className="text-medical-600"> Medical Practice</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                A complete solution for managing patients, appointments, billing, and inventory. 
                Built for clinics and hospitals of all sizes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/signup">
                  <Button size="lg" className="bg-medical-600 hover:bg-medical-700 text-white px-8 w-full sm:w-auto">
                    Start Free Trial
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="px-8 w-full sm:w-auto">
                    View Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                        <img 
                          src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">500+ clinics</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-medical-50 to-medical-100 rounded-2xl p-6 md:p-8">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Medical professional using tablet" 
                  className="rounded-xl shadow-lg w-full"
                />
              </div>
              {/* Stats card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">15,000+</p>
                    <p className="text-xs text-gray-500">Patients Managed</p>
                  </div>
                </div>
              </div>
              {/* Appointment card */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Next: 10:30 AM</p>
                    <p className="text-xs text-gray-500">Dr. Sharma</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to manage every aspect of your healthcare practice efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-xl border border-gray-100 hover:border-medical-200 hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-medical-50 rounded-lg flex items-center justify-center text-medical-600 mb-4">
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Dashboard preview" 
                className="rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Designed for Healthcare Professionals
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our platform is built with input from doctors, nurses, and clinic administrators 
                to ensure it meets real-world healthcare needs.
              </p>
              <div className="space-y-4">
                {[
                  "Intuitive dashboard with quick access to patient records",
                  "Automated appointment reminders via SMS and email",
                  "Real-time inventory tracking with low stock alerts",
                  "Comprehensive reporting and analytics",
                  "Multi-user access with role-based permissions"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-medical-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-medical-600 rounded-full"></div>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/signup">
                <Button className="bg-medical-600 hover:bg-medical-700 text-white mt-4">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-medical-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-3xl md:text-4xl font-bold">500+</p>
              <p className="text-medical-100 text-sm mt-1">Active Clinics</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">15,000+</p>
              <p className="text-medical-100 text-sm mt-1">Patients Managed</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">99.9%</p>
              <p className="text-medical-100 text-sm mt-1">Uptime</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">24/7</p>
              <p className="text-medical-100 text-sm mt-1">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Healthcare Providers
            </h2>
            <p className="text-gray-600">
              See what medical professionals say about our platform.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                "{testimonials[activeTestimonial].content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-medical-100 rounded-full flex items-center justify-center">
                  <span className="text-medical-700 font-semibold">
                    {testimonials[activeTestimonial].name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</p>
                  <p className="text-sm text-gray-500">
                    {testimonials[activeTestimonial].role} • {testimonials[activeTestimonial].clinic}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === activeTestimonial ? 'bg-medical-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-medical-600 to-medical-700 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to modernize your practice?
            </h2>
            <p className="text-medical-100 mb-8 max-w-xl mx-auto">
              Join hundreds of healthcare providers who have streamlined their operations with HealthCare.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-medical-700 font-semibold px-8 w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-medical-800 hover:bg-medical-900 text-white font-semibold px-8 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-gray-600 mb-8">
                Have questions? Our team is here to help you get started.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-medical-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-medical-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">support@medcarepro.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-medical-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">Chennai, Tamil Nadu, India</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <Button className="w-full bg-medical-600 hover:bg-medical-700 text-white">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">HealthCare</span>
              </div>
              <p className="text-gray-500 text-sm max-w-sm">
                Smart healthcare management system designed for modern clinics and hospitals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#services" className="text-gray-500 hover:text-gray-900">Services</a></li>
                <li><a href="#features" className="text-gray-500 hover:text-gray-900">Features</a></li>
                <li><a href="#testimonials" className="text-gray-500 hover:text-gray-900">Testimonials</a></li>
                <li><a href="#contact" className="text-gray-500 hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-gray-500 hover:text-gray-900">Sign In</Link></li>
                <li><Link to="/signup" className="text-gray-500 hover:text-gray-900">Create Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} HealthCare. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      
      <AIAgentToggle />
    </div>
  );
};

export default Landing;
