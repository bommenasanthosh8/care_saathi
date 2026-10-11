import React, { useState, useEffect, useRef } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SearchProvider, useSearch } from './context/SearchContext';
import { Sidebar, SIDEBAR_EXPANDED_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './components/Sidebar';
import { Footer } from './components/Footer';
import { EmergencyBanner } from './components/EmergencyBanner';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { PrescriptionModal } from './components/PrescriptionModal';
import { TrustDashboardModal } from './components/TrustDashboardModal';
import { GuidedChatDrawer } from './components/GuidedChatDrawer';
import { SavedComparisonsModal } from './components/SavedComparisonsModal';
import { PublicLandingPage } from './pages/PublicLandingPage';
import { LoginPage } from './pages/LoginPage';
import { JourneyContextBar } from './components/JourneyContextBar';
import { appointmentRepo, Appointment } from './services/appointmentRepository';
import { MessageSquare, Sparkles, Menu, Clock, ArrowLeft } from 'lucide-react';

// Authenticated Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CostEstimatorPage } from './pages/CostEstimatorPage';
import { HospitalDiscoveryPage } from './pages/HospitalDiscoveryPage';
import { SchemeNavigatorPage } from './pages/SchemeNavigatorPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { HealthCardFinderPage } from './pages/HealthCardFinderPage';

const PROTECTED_TABS = ['dashboard', 'estimate', 'hospitals', 'health-cards', 'schemes', 'comparison', 'profile'];

const getInitialPath = (): string => {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.replace(/^\//, '');
};

const getInitialLoginMode = (): 'login' | 'register' => {
  if (typeof window === 'undefined') return 'login';
  const mode = new URLSearchParams(window.location.search).get('mode');
  return mode === 'register' ? 'register' : 'login';
};

const AppContent: React.FC = () => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const { searchState, setSearchQuery, setTreatment, setLocation } = useSearch();

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>(getInitialLoginMode);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = getInitialPath();
    if (PROTECTED_TABS.includes(path) || path === 'methodology') {
      return path;
    }
    return 'landing';
  });

  const pendingRedirectRef = useRef<string | null>(null);
  const [replayKey, setReplayKey] = useState<number>(0);

  const [emergencyMessage, setEmergencyMessage] = useState<string | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>("");
  const [chatInitialRxFilename, setChatInitialRxFilename] = useState<string>("");
  const [isSavedComparisonsOpen, setIsSavedComparisonsOpen] = useState(false);
  const [judgeToast, setJudgeToast] = useState<string | null>(null);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [upcomingReminder, setUpcomingReminder] = useState<Appointment | null>(null);

  // Left Sidebar state: responsive collapse for tablets, slide-out drawer for mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    return false;
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Navigation helpers for public and login routes
  const navigateToLogin = (mode: 'login' | 'register' = 'login') => {
    // If user is already logged in, redirect directly to Home ("/")
    if (user || token) {
      pendingRedirectRef.current = null;
      setActiveTab('landing');
      setCurrentPath('');
      window.history.replaceState(null, '', '/');
      return;
    }
    setLoginMode(mode);
    setCurrentPath('login');
    const url = mode === 'register' ? '/login?mode=register' : '/login';
    window.history.pushState(null, '', url);
  };

  const navigateToPublic = (path: string = '/') => {
    const clean = path.replace(/^\//, '');
    setCurrentPath(clean);
    window.history.pushState(null, '', path.startsWith('/') ? path : `/${path}`);
  };

  // Protected route navigation helper with URL synchronization
  const navigateToTab = (targetTab: string) => {
    if (PROTECTED_TABS.includes(targetTab)) {
      if (!user && !token) {
        pendingRedirectRef.current = targetTab;
        navigateToLogin('login');
        return;
      }
    }
    setActiveTab(targetTab);
    const pathName = targetTab === 'landing' ? '' : targetTab;
    setCurrentPath(pathName);
    const targetPath = targetTab === 'landing' ? '/' : `/${targetTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Direct URL access / page refresh route protection
  useEffect(() => {
    if (isAuthLoading) return;

    const path = window.location.pathname.replace(/^\//, '');
    setCurrentPath(prev => prev === path ? prev : path);

    if (user || token) {
      // Signed-in users who visit / or /login or /landing go straight to Home (/)
      // /welcome is intentionally preserved for signed-in users to experience the intro!
      if (path === '' || path === 'login' || path === 'landing') {
        pendingRedirectRef.current = null;
        setActiveTab('landing');
        setCurrentPath('');
        window.history.replaceState(null, '', '/');
      } else if (PROTECTED_TABS.includes(path) || path === 'methodology') {
        setActiveTab(path);
      }
    } else {
      // Signed-out visitors attempting to hit a protected tab
      if (PROTECTED_TABS.includes(path)) {
        pendingRedirectRef.current = path;
        window.history.replaceState(null, '', '/login');
        setCurrentPath('login');
      }
    }
  }, [isAuthLoading, user, token]);

  // Handle browser Back / Forward (popstate) without navigation loops
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      const mode = new URLSearchParams(window.location.search).get('mode');
      if (mode === 'register') setLoginMode('register');
      else setLoginMode('login');

      setCurrentPath(path);

      if (user || token) {
        if (path === '' || path === 'login' || path === 'landing') {
          pendingRedirectRef.current = null;
          window.history.replaceState(null, '', '/');
          setActiveTab('landing');
          setCurrentPath('');
        } else if (PROTECTED_TABS.includes(path) || path === 'methodology') {
          setActiveTab(path);
        }
      } else {
        if (PROTECTED_TABS.includes(path)) {
          pendingRedirectRef.current = path;
          window.history.replaceState(null, '', '/login');
          setCurrentPath('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, token]);

  // Check for upcoming appointments within 24 hours on load
  useEffect(() => {
    appointmentRepo.getMyAppointments().then(list => {
      const now = Date.now();
      const imminent = list.find(a => {
        if (a.status === 'Cancelled' || a.status === 'Completed') return false;
        const time = a.slot_start ? new Date(a.slot_start).getTime() : 0;
        const diff = (time - now) / 3600000;
        return diff >= 0 && diff <= 24;
      });
      if (imminent) setUpcomingReminder(imminent);
    });
  }, [activeTab]);

  // Successful authentication redirect - always redirect user to Home ("/") using replace navigation
  const handleAuthSuccess = () => {
    pendingRedirectRef.current = null;
    setActiveTab('landing');
    setCurrentPath('');
    window.history.replaceState(null, '', '/');
  };

  const handleVoiceConfirm = (transcript: string) => {
    setSearchQuery(transcript);
    setChatInitialQuery(transcript);
    navigateToTab('dashboard');
    setIsChatOpen(true);
  };

  const handleRxConfirm = (treatmentName: string, treatmentId?: string) => {
    // Map procedure name to canonical treatment ID if not already supplied
    let resolvedId = treatmentId;
    let resolvedName = treatmentName;

    if (!resolvedId) {
      const lower = treatmentName.toLowerCase();
      if (lower.includes('knee') || lower.includes('tkr') || lower.includes('joint replacement') || lower.includes('arthroplasty')) {
        resolvedId = 'knee_replacement';
        resolvedName = 'Total Knee Replacement (TKR)';
      } else if (lower.includes('cataract') || lower.includes('phaco') || lower.includes('iol') || lower.includes('lens')) {
        resolvedId = 'cataract_surgery';
        resolvedName = 'Cataract Surgery (Phaco + IOL)';
      } else if (lower.includes('angioplasty') || lower.includes('ptca') || lower.includes('stent')) {
        resolvedId = 'angioplasty';
        resolvedName = 'Coronary Angioplasty (PTCA)';
      } else if (lower.includes('cabg') || lower.includes('bypass')) {
        resolvedId = 'cabg';
        resolvedName = 'Coronary Artery Bypass Graft (CABG)';
      } else if (lower.includes('appendectomy') || lower.includes('appendix')) {
        resolvedId = 'appendectomy';
        resolvedName = 'Laparoscopic Appendectomy';
      } else if (lower.includes('cholecystectomy') || lower.includes('gallbladder')) {
        resolvedId = 'cholecystectomy';
        resolvedName = 'Laparoscopic Cholecystectomy (Gallbladder)';
      } else if (lower.includes('hernia')) {
        resolvedId = 'hernia_repair';
        resolvedName = 'Inguinal Hernia Repair';
      } else if (lower.includes('cesarean') || lower.includes('c-section') || lower.includes('lscs')) {
        resolvedId = 'cesarean_section';
        resolvedName = 'Cesarean Delivery (C-Section)';
      } else if (lower.includes('normal delivery')) {
        resolvedId = 'normal_delivery';
        resolvedName = 'Normal Vaginal Delivery';
      } else if (lower.includes('mri') || lower.includes('magnetic resonance')) {
        resolvedId = 'mri_brain';
        resolvedName = 'MRI Brain with Contrast';
      } else if (lower.includes('ct') || lower.includes('computed tomography')) {
        resolvedId = 'ct_abdomen';
        resolvedName = 'CT Abdomen and Pelvis';
      } else if (lower.includes('dialysis') || lower.includes('hemodialysis')) {
        resolvedId = 'hemodialysis';
        resolvedName = 'Hemodialysis (Single Session)';
      }
    }

    const finalId = resolvedId || 'knee_replacement';
    const finalName = resolvedName || treatmentName;

    setSearchQuery(finalName);
    setTreatment(finalId, finalName);
    navigateToTab('dashboard');
  };

  const triggerEmergency = (msg: string) => {
    setEmergencyMessage(msg);
  };

  const handleRunJudgeDemo = () => {
    setTreatment('knee_replacement', 'Total Knee Replacement (TKR)');
    setLocation('Hyderabad', '');
    setSearchQuery('Total Knee Replacement in Hyderabad');
    navigateToTab('dashboard');
    setJudgeToast('🎯 Judge Demo Scenario Loaded: Total Knee Replacement (TKR) in Hyderabad | Target: ₹2.5 Lakh Income, White Card / Aarogyasri Scheme');
    setTimeout(() => {
      setJudgeToast(null);
    }, 7000);
  };

  // =========================================================================
  // 1. DEDICATED /welcome (INTRO) ROUTE - ALWAYS ACCESSIBLE (SIGNED IN OR NOT)
  // =========================================================================
  if (currentPath === 'welcome') {
    return (
      <PublicLandingPage
        key={`welcome-${replayKey}`}
        onNavigateToLogin={navigateToLogin}
        onNavigateToMethodology={() => navigateToPublic('methodology')}
        isAuthenticated={!!(user || token)}
        onOpenDashboard={() => navigateToTab('dashboard')}
      />
    );
  }

  // =========================================================================
  // 2. SIGNED-OUT VISITOR FLOW (NO SIDEBAR, NO DASHBOARD, NO APP SHELL)
  // =========================================================================
  if (!user && !token) {
    // Dedicated Full-Page /login Route
    if (currentPath === 'login') {
      return (
        <LoginPage
          initialMode={loginMode}
          onSuccess={handleAuthSuccess}
          onNavigateHome={() => navigateToPublic('/')}
        />
      );
    }

    // Public Methodology Page Route
    if (currentPath === 'methodology') {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF7', display: 'flex', flexDirection: 'column' }}>
          <header style={{
            padding: '16px 28px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              onClick={() => navigateToPublic('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64717D',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                fontWeight: 500
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Overview</span>
            </button>
            <div
              onClick={() => navigateToPublic('/')}
              style={{ cursor: 'pointer', fontFamily: "Georgia, serif", fontSize: '1.25rem', fontWeight: 700, color: '#102A36' }}
            >
              CareSaathi <span style={{ color: '#438F84' }}>AI</span>
            </div>
            <button
              onClick={() => navigateToLogin('login')}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.86rem' }}
            >
              Log in
            </button>
          </header>
          <div style={{ flex: 1 }}>
            <MethodologyPage />
          </div>
        </div>
      );
    }

    // Public Landing Page (/)
    return (
      <PublicLandingPage
        key={`landing-${replayKey}`}
        onNavigateToLogin={navigateToLogin}
        onNavigateToMethodology={() => navigateToPublic('methodology')}
      />
    );
  }

  // =========================================================================
  // 2. SIGNED-IN APPLICATION FLOW (COMPLETE APP SHELL WITH SIDEBAR & TABS)
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', backgroundColor: 'var(--color-warm-bg)' }}>
      {/* Emergency Alert Banner */}
      {emergencyMessage && (
        <EmergencyBanner
          message={emergencyMessage}
          onDismiss={() => setEmergencyMessage(null)}
        />
      )}

      {/* Judge Demo Banner / Toast (Teal/Ink, No Amber) */}
      {judgeToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          backgroundColor: '#102A36',
          color: '#E7F3EF',
          padding: '12px 24px',
          borderRadius: '50px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid #438F84',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'slideDown 0.3s ease-out',
          maxWidth: '90vw'
        }}>
          <Sparkles size={18} color="#5EEAD4" style={{ flexShrink: 0 }} />
          <span>{judgeToast}</span>
          <button
            onClick={() => setJudgeToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              marginLeft: '8px',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        onOpenSearch={() => navigateToTab('dashboard')}
        onOpenTrustDashboard={() => setIsTrustOpen(true)}
        onOpenChatDrawer={() => setIsChatOpen(true)}
        onRunJudgeDemo={handleRunJudgeDemo}
        onOpenAuth={() => navigateToLogin('login')}
        onOpenSavedComparisons={() => setIsSavedComparisonsOpen(true)}
      />

      {/* 2. Main Application Content Layout */}
      <div
        className={`app-main-layout ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}
        style={{
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflowX: 'hidden'
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .app-main-layout.expanded {
              margin-left: ${SIDEBAR_EXPANDED_WIDTH}px;
              width: calc(100% - ${SIDEBAR_EXPANDED_WIDTH}px);
            }
            .app-main-layout.collapsed {
              margin-left: ${SIDEBAR_COLLAPSED_WIDTH}px;
              width: calc(100% - ${SIDEBAR_COLLAPSED_WIDTH}px);
            }
            .mobile-top-bar {
              display: none !important;
            }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .app-main-layout.expanded {
              margin-left: ${SIDEBAR_EXPANDED_WIDTH}px;
              width: calc(100% - ${SIDEBAR_EXPANDED_WIDTH}px);
            }
            .app-main-layout.collapsed {
              margin-left: ${SIDEBAR_COLLAPSED_WIDTH}px;
              width: calc(100% - ${SIDEBAR_COLLAPSED_WIDTH}px);
            }
            .mobile-top-bar {
              display: none !important;
            }
          }
          @media (max-width: 767px) {
            .app-main-layout {
              margin-left: 0 !important;
              width: 100% !important;
            }
            .mobile-top-bar {
              display: flex !important;
            }
          }
          .simple-mode {
            font-size: 1.08rem !important;
          }
          .simple-mode h1 { font-size: 2.3rem !important; font-weight: 800 !important; }
          .simple-mode h2 { font-size: 1.85rem !important; }
          .simple-mode .btn { padding: 12px 22px !important; font-size: 1rem !important; }
        `}</style>

        {/* Mobile Top Bar */}
        <header
          className="mobile-top-bar"
          style={{
            height: '56px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--color-border)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 90
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsMobileNavOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-navy)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>
            <div
              onClick={() => navigateToTab('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-navy)' }}>
                CareSaathi <span style={{ color: 'var(--color-teal)' }}>AI</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <div
                onClick={() => navigateToTab('profile')}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-teal)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            ) : null}
          </div>
        </header>

        {/* Journey Context Stepper Bar */}
        <JourneyContextBar
          currentStage={activeTab === 'estimate' ? 3 : activeTab === 'hospitals' ? 4 : (activeTab === 'schemes' || activeTab === 'comparison') ? 5 : (searchState.city ? 2 : 1)}
          onNavigateTab={navigateToTab}
          isSimpleMode={isSimpleMode}
          onToggleSimpleMode={() => setIsSimpleMode(!isSimpleMode)}
        />

        {/* 24-Hour Imminent Appointment Alert Toast */}
        {upcomingReminder && (
          <div style={{
            margin: '12px 24px 0 24px',
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.86rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} color="#2563EB" />
              <span>
                <strong>Upcoming Consultation:</strong> {upcomingReminder.facility_name} on{' '}
                {new Date(upcomingReminder.slot_start || '').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(upcomingReminder.slot_start || '').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              onClick={() => navigateToTab('profile')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563EB',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              View Appointment
            </button>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className={isSimpleMode ? 'simple-mode' : ''} style={{ flex: 1, width: '100%', minWidth: 0 }}>
          {activeTab === 'landing' && (
            <LandingPage
              onStartSearch={(query) => {
                if (query) {
                  setSearchQuery(query);
                }
                navigateToTab('dashboard');
              }}
              onExploreCost={() => navigateToTab('estimate')}
              onExploreHospitals={() => navigateToTab('hospitals')}
              onExploreSchemes={() => navigateToTab('schemes')}
              onExploreHealthCards={() => navigateToTab('health-cards')}
              onHowItWorks={() => navigateToTab('methodology')}
              onOpenVoice={() => setIsVoiceOpen(true)}
              onOpenRx={() => setIsRxOpen(true)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenVoice={() => setIsVoiceOpen(true)}
              onOpenRx={() => setIsRxOpen(true)}
              onNavigateTab={tab => navigateToTab(tab)}
              onTriggerEmergency={triggerEmergency}
            />
          )}

          {activeTab === 'estimate' && <CostEstimatorPage />}
          {activeTab === 'hospitals' && <HospitalDiscoveryPage />}
          {activeTab === 'health-cards' && <HealthCardFinderPage />}
          {activeTab === 'schemes' && <SchemeNavigatorPage />}
          {activeTab === 'comparison' && <ComparisonPage onBackToSearch={() => navigateToTab('hospitals')} />}
          {activeTab === 'methodology' && <MethodologyPage />}
          {activeTab === 'profile' && <UserProfilePage onNavigateTab={tab => navigateToTab(tab)} />}
        </main>

        {/* Footer */}
        <Footer
          setActiveTab={navigateToTab}
          onReplayIntro={() => {
            setReplayKey(prev => prev + 1);
            navigateToPublic('welcome');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
        />
      </div>

      {/* Floating CareSaathi Chat Action Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: searchState.comparisonList.length > 0 && activeTab !== 'comparison' ? '88px' : '24px',
          right: '24px',
          zIndex: 89,
          backgroundColor: '#075E54',
          color: 'white',
          border: '2px solid #25D366',
          borderRadius: '50px',
          padding: '12px 20px',
          boxShadow: '0 4px 15px rgba(7, 94, 84, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.88rem',
          transition: 'all 0.2s ease'
        }}
        title="Open CareSaathi WhatsApp-style Assistant"
      >
        <MessageSquare size={18} color="#25D366" />
        <span>Ask CareSaathi</span>
      </button>

      {/* Modals */}
      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onConfirmText={handleVoiceConfirm}
      />

      <PrescriptionModal
        isOpen={isRxOpen}
        onClose={() => setIsRxOpen(false)}
        onConfirmTreatment={handleRxConfirm}
        onOpenChatWithRx={(filename) => {
          setIsRxOpen(false);
          setChatInitialRxFilename(filename || "prescription.jpg");
          setChatInitialQuery("ఈ ప్రిస్క్రిప్షన్‌ను పరిశీలించి మందుల ఖర్చు చెప్పండి");
          setIsChatOpen(true);
        }}
      />

      <TrustDashboardModal
        isOpen={isTrustOpen}
        onClose={() => setIsTrustOpen(false)}
      />

      <SavedComparisonsModal
        isOpen={isSavedComparisonsOpen}
        onClose={() => setIsSavedComparisonsOpen(false)}
        onOpenComparisonPage={() => {
          setIsSavedComparisonsOpen(false);
          navigateToTab('comparison');
        }}
      />

      <GuidedChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialQuery("");
          setChatInitialRxFilename("");
        }}
        onTriggerEmergency={triggerEmergency}
        onSelectEstimate={_tId => {
          navigateToTab('dashboard');
          setIsChatOpen(false);
        }}
        initialQuery={chatInitialQuery}
        initialRxFilename={chatInitialRxFilename}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SearchProvider>
          <AppContent />
        </SearchProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
