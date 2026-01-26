import React, { useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  PieChart, 
  Users, 
  Smartphone, 
  Menu, 
  X,
  Sun,
  Moon,
  TrendingUp,
  Bell,
  Lock,
  CreditCard
} from 'lucide-react';
import Logo from '../components/Logo';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin, isDark, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgLight dark:bg-gray-900 text-dark dark:text-gray-100 font-sans transition-colors duration-200 overflow-x-hidden selection:bg-primary/20">
      
      {/* Background Blobs (Using existing animations from index.html) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen filter opacity-50 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen filter opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen filter opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-gray-100/50 dark:border-gray-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo />
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-subtext dark:text-gray-300 hover:text-primary transition font-medium text-sm">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-subtext dark:text-gray-300 hover:text-primary transition font-medium text-sm">Pricing</button>
              <button 
                onClick={toggleTheme} 
                className="p-2 text-subtext dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={onLogin} className="text-dark dark:text-white font-semibold hover:text-primary transition text-sm">Log in</button>
              <button 
                onClick={onGetStarted}
                className="bg-dark dark:bg-white dark:text-dark text-white hover:bg-primary dark:hover:bg-gray-200 px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
               <button 
                onClick={toggleTheme} 
                className="p-2 text-subtext dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-dark dark:text-white">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute w-full shadow-2xl">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-4 text-base font-medium text-dark dark:text-gray-200 border-b border-gray-50 dark:border-gray-800">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-3 py-4 text-base font-medium text-dark dark:text-gray-200 border-b border-gray-50 dark:border-gray-800">Pricing</button>
              <button onClick={onLogin} className="block w-full text-left px-3 py-4 text-base font-medium text-dark dark:text-gray-200">Log in</button>
              <div className="px-3 pt-2">
                <button 
                  onClick={onGetStarted}
                  className="w-full bg-primary text-white px-6 py-3 rounded-xl font-bold text-center"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Increased spacing for tablet view (md:pt-32) while keeping mobile (pt-16) and desktop (lg:pt-24) balanced */}
      <section className="pt-16 md:pt-32 lg:pt-24 pb-20 lg:pb-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-blue-100 dark:border-gray-700 text-primary font-semibold text-xs uppercase tracking-wider mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Trusted by 500+ Groups
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-dark dark:text-white leading-[1.1]">
              Make your Chama <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Work For You.</span>
            </h1>
            <p className="text-lg text-subtext dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Automate contributions, track loans, and manage dividends with a dashboard designed for modern investment groups.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <button 
                onClick={onGetStarted}
                className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight size={20} />
              </button>
              <button 
                onClick={onLogin}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-dark dark:text-white border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-full font-bold text-lg transition flex items-center justify-center hover:shadow-lg"
              >
                View Demo
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-subtext dark:text-gray-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-accent"/> No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-accent"/> 14-day free trial
              </div>
            </div>
          </div>

          {/* Hero Visual / Mock UI */}
          <div className="relative lg:h-[550px] flex items-center justify-center perspective-1000">
             {/* Abstract Shapes */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl -z-10"></div>
             
             {/* Floating Cards Mockup */}
             <div className="relative w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-700 ease-out">
               
               {/* Main Card */}
               <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative z-10">
                 {/* Mock Header */}
                 <div className="h-14 border-b border-gray-100 dark:border-gray-700 flex items-center px-6 gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                 </div>
                 {/* Mock Content */}
                 <div className="p-6 space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-subtext">Total Balance</p>
                        <h3 className="text-2xl font-bold text-dark dark:text-white">KES 1,240,500</h3>
                      </div>
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    
                    {/* Mock Graph */}
                    <div className="flex items-end gap-2 h-32 pt-4 border-t border-dashed border-gray-100 dark:border-gray-700">
                       {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                         <div key={i} className="flex-1 bg-blue-50 dark:bg-gray-700 rounded-t-md relative group overflow-hidden">
                            <div 
                              className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all duration-1000" 
                              style={{ height: `${h}%` }}
                            ></div>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary text-xs">JD</div>
                         <div className="flex-1">
                           <div className="h-2 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                           <div className="h-1.5 w-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
                         </div>
                         <div className="text-green-500 text-xs font-bold">+5k</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                         <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs">MK</div>
                         <div className="flex-1">
                           <div className="h-2 w-20 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                           <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                         </div>
                         <div className="text-green-500 text-xs font-bold">+2k</div>
                      </div>
                    </div>
                 </div>
               </div>

               {/* Floating Element 1 (Loan Approved) */}
               <div className="absolute -right-8 top-20 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-subtext">Loan Status</p>
                      <p className="font-bold text-dark dark:text-white">Approved</p>
                    </div>
                  </div>
               </div>

               {/* Floating Element 2 (Credit Card) */}
               <div className="absolute -left-8 bottom-20 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-subtext">Next Payout</p>
                      <p className="font-bold text-dark dark:text-white">Oct 25th</p>
                    </div>
                  </div>
               </div>

             </div>
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section id="features" className="py-24 relative z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-xs mb-3">Capabilities</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-dark dark:text-white mb-6">More than just a spreadsheet.</h3>
            <p className="text-subtext dark:text-gray-400 max-w-2xl mx-auto">
              Built specifically for Chamas, Saccos, and Investment Groups to handle complex financial relationships with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            
            {/* Feature 1: Automated Records (Large) */}
            <div className="md:col-span-2 bg-bgLight dark:bg-gray-800 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700">
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary mb-6">
                   <PieChart size={24} />
                 </div>
                 <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">Automated Financial Records</h4>
                 <p className="text-subtext dark:text-gray-400 max-w-md">
                   Every contribution, loan repayment, and fine is automatically categorized. Generate monthly reports in seconds, not hours.
                 </p>
               </div>
               {/* Decorative Chart */}
               <div className="absolute right-0 bottom-0 w-1/2 h-48 translate-x-8 translate-y-8 opacity-50 group-hover:opacity-100 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-500">
                  <div className="flex items-end gap-3 h-full pb-8 pr-8">
                    <div className="flex-1 bg-primary/20 rounded-t-lg h-[40%]"></div>
                    <div className="flex-1 bg-primary/40 rounded-t-lg h-[70%]"></div>
                    <div className="flex-1 bg-primary/60 rounded-t-lg h-[50%]"></div>
                    <div className="flex-1 bg-primary/80 rounded-t-lg h-[90%]"></div>
                    <div className="flex-1 bg-primary rounded-t-lg h-[65%]"></div>
                  </div>
               </div>
            </div>

            {/* Feature 2: Mobile Access (Tall/Square) */}
            <div className="bg-[#16DBCC]/10 dark:bg-[#16DBCC]/5 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-xl transition-all border border-[#16DBCC]/20">
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-[#16DBCC]/20 rounded-2xl flex items-center justify-center text-[#16DBCC] mb-6">
                   <Smartphone size={24} />
                 </div>
                 <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">Mobile First</h4>
                 <p className="text-subtext dark:text-gray-400">
                   Access your dashboard from anywhere. Optimized for phones and tablets.
                 </p>
               </div>
               <div className="absolute -right-4 -bottom-12 w-32 h-48 bg-white dark:bg-gray-800 rounded-xl border-4 border-gray-100 dark:border-gray-700 transform -rotate-12 group-hover:-rotate-6 transition-all duration-500 shadow-lg"></div>
            </div>

            {/* Feature 3: Security (Square) */}
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-xl transition-all border border-purple-100 dark:border-purple-900/20">
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                   <Lock size={24} />
                 </div>
                 <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">Bank-Grade Security</h4>
                 <p className="text-subtext dark:text-gray-400">
                   256-bit encryption and role-based access control keep your group's money safe.
                 </p>
               </div>
               <div className="absolute top-8 right-8 text-purple-200 dark:text-purple-900/40 transform scale-150 group-hover:scale-[1.7] transition-transform duration-500">
                 <Shield size={100} />
               </div>
            </div>

            {/* Feature 4: Member Management (Wide) */}
            <div className="md:col-span-2 bg-bgLight dark:bg-gray-800 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700">
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1">
                   <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-500 mb-6">
                     <Users size={24} />
                   </div>
                   <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">Transparent Member Management</h4>
                   <p className="text-subtext dark:text-gray-400">
                     Track individual performance, assign roles (Treasurer, Secretary), and manage contact details in one place.
                   </p>
                 </div>
                 {/* Decorative Avatars */}
                 <div className="flex-1 flex justify-center md:justify-end pr-8">
                    <div className="flex -space-x-4 hover:space-x-1 transition-all duration-300">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-md relative z-${i * 10}`}>
                          <img src={`https://picsum.photos/100?random=${i}`} className="w-full h-full rounded-full object-cover" alt="Member" />
                        </div>
                      ))}
                      <div className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 bg-gray-50 dark:bg-gray-700 flex items-center justify-center shadow-md z-50 text-xs font-bold text-subtext">
                        +12
                      </div>
                    </div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-xs mb-3">Pricing Plans</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-dark dark:text-white mb-6">Transparent pricing for every stage</h3>
            <p className="text-subtext dark:text-gray-400">Choose the plan that fits your group size and needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Tier */}
            <PricingCard 
              title="Starter"
              price="Free"
              description="Perfect for small family groups just getting started."
              features={[
                "Up to 5 Members",
                "Basic Contribution Tracking",
                "Manual Reports",
                "Email Support"
              ]}
              buttonText="Start Free"
              onClick={onGetStarted}
            />

            {/* Growth Tier */}
            <PricingCard 
              title="Growth"
              price="KES 500"
              period="/ month"
              description="Ideal for active chamas looking to automate operations."
              isPopular
              features={[
                "Up to 20 Members",
                "Automated Loan Calculator",
                "SMS Notifications",
                "PDF Reports Export",
                "Priority Support"
              ]}
              buttonText="Get Growth"
              onClick={onGetStarted}
            />

            {/* Scale Tier */}
            <PricingCard 
              title="Scale"
              price="KES 1,500"
              period="/ month"
              description="For large investment groups and cooperatives."
              features={[
                "Unlimited Members",
                "Multiple Admin Accounts",
                "Investment Portfolio Tracking",
                "API Access",
                "Dedicated Account Manager"
              ]}
              buttonText="Contact Sales"
              onClick={onGetStarted}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-700 pt-16 pb-8 transition-colors relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <Logo className="w-8 h-8" textClassName="text-xl"/>
              <p className="mt-4 text-sm text-subtext dark:text-gray-400 leading-relaxed">
                Empowering communities to achieve financial freedom through transparent and efficient group management.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-dark dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-subtext dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition">Features</a></li>
                <li><a href="#" className="hover:text-primary transition">Security</a></li>
                <li><a href="#" className="hover:text-primary transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-dark dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-subtext dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-dark dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-subtext dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-subtext dark:text-gray-500">
              &copy; {new Date().getFullYear()} Pesa Chama Manager. All rights reserved.
            </p>
            <div className="flex gap-6">
               {/* Social placeholders */}
               <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer text-gray-400 dark:text-gray-500">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
               </div>
               <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer text-gray-400 dark:text-gray-500">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Sub-components for cleaner code

const PricingCard: React.FC<{ 
  title: string, 
  price: string, 
  period?: string, 
  description: string, 
  features: string[], 
  buttonText: string, 
  isPopular?: boolean,
  onClick: () => void 
}> = ({ title, price, period, description, features, buttonText, isPopular, onClick }) => (
  <div className={`relative p-8 rounded-[2rem] transition-all duration-300 flex flex-col hover:-translate-y-2 ${isPopular ? 'bg-white dark:bg-gray-800 shadow-2xl border-2 border-primary transform md:-translate-y-4 z-10' : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700'}`}>
    {isPopular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
        Most Popular
      </div>
    )}
    <div className="mb-6">
      <h4 className="text-lg font-bold text-dark dark:text-white mb-2">{title}</h4>
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-dark dark:text-white">{price}</span>
        {period && <span className="text-subtext dark:text-gray-400 ml-1">{period}</span>}
      </div>
      <p className="mt-4 text-sm text-subtext dark:text-gray-400 h-10">{description}</p>
    </div>
    
    <div className="flex-1 mb-8">
      <ul className="space-y-4">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-dark dark:text-gray-300">
            <CheckCircle size={18} className="text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>

    <button 
      onClick={onClick}
      className={`w-full py-3.5 rounded-xl font-bold transition-all ${
        isPopular 
          ? 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20' 
          : 'bg-blue-50 dark:bg-gray-700 text-primary hover:bg-blue-100 dark:hover:bg-gray-600'
      }`}
    >
      {buttonText}
    </button>
  </div>
);

export default Landing;