import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Search,
  MapPin,
  FileText,
  HelpCircle,
  Layers,
  Globe,
  X,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Calculator,
  ChevronRight
} from 'lucide-react';

export const SIDEBAR_EXPANDED_WIDTH = 250;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenSearch: () => void;
  onOpenTrustDashboard?: () => void;
  onOpenChatDrawer?: () => void;
  onRunJudgeDemo?: () => void;
  onOpenAuth?: () => void;
  onOpenSavedComparisons?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenSearch: _onOpenSearch,
  onOpenTrustDashboard,
  onOpenChatDrawer,
  onRunJudgeDemo,
  onOpenAuth,
  onOpenSavedComparisons
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, savedComparisons } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: t('navHome'), icon: Heart },
    { id: 'dashboard', label: t('navDashboard'), icon: Search },
    { id: 'estimate', label: t('navEstimate'), icon: Calculator },
    { id: 'hospitals', label: t('navFindHospitals'), icon: MapPin },
    { id: 'health-cards', label: t('navHealthCards'), icon: CreditCard },
    { id: 'schemes', label: t('navFinancialSupport'), icon: FileText },
    { id: 'methodology', label: t('navHowItWorks'), icon: HelpCircle },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 260);
      return next;
    });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 998,
            transition: 'opacity 0.25s ease'
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="care-saathi-sidebar"
        className={`care-saathi-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isCollapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_EXPANDED_WIDTH}px`,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          boxShadow: 'var(--shadow-sm)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <style>{`
          .care-saathi-sidebar::-webkit-scrollbar {
            width: 4px;
          }
          .care-saathi-sidebar::-webkit-scrollbar-thumb {
            background-color: #E2E8F0;
            border-radius: 4px;
          }
          @media (max-width: 767px) {
            .care-saathi-sidebar {
              width: 270px !important;
              transform: translateX(-100%);
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            }
            .care-saathi-sidebar.mobile-open {
              transform: translateX(0) !important;
            }
          }
          .nav-item-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 10px 14px;
            border: none;
            border-radius: var(--radius-md);
            background: transparent;
            color: var(--color-navy);
            font-size: 0.9rem;
            font-weight: 500;
            text-align: left;
            cursor: pointer;
            transition: all 0.18s ease;
            position: relative;
          }
          .nav-item-btn:hover {
            background-color: #F8FAFC;
            color: var(--color-teal-dark);
          }
          .nav-item-btn.active {
            background-color: var(--color-mint);
            color: var(--color-teal-dark);
            font-weight: 600;
          }
          .nav-item-btn.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 6px;
            bottom: 6px;
            width: 3px;
            background-color: var(--color-teal);
            border-radius: 0 3px 3px 0;
          }
          .nav-item-btn.collapsed-btn {
            justify-content: center;
            padding: 10px 0;
          }
          .nav-item-btn.collapsed-btn.active::before {
            display: none;
          }
          .section-label {
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #94A3B8;
            padding: 14px 14px 6px;
            text-transform: uppercase;
          }
        `}</style>

        {/* 1. Header: Logo & Branding */}
        <div
          style={{
            height: '70px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 8px' : '0 16px',
            flexShrink: 0
          }}
        >
          {/* Logo + Brand name */}
          <div
            onClick={() => handleNavClick('landing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              minWidth: 0,
              overflow: 'hidden'
            }}
            title="CareSaathi AI"
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-mint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-teal)',
                flexShrink: 0
              }}
            >
              <Heart size={20} fill="var(--color-teal)" />
            </div>

            {!isCollapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    color: 'var(--color-navy)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  CareSaathi <span style={{ color: 'var(--color-teal)' }}>AI</span>
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    color: 'var(--color-text-grey)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  Healthcare Navigator
                </div>
              </div>
            )}
          </div>

          {/* Desktop/Tablet Collapse Toggle & Mobile Close */}
          <div>
            {/* On Mobile: Close 'X' button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="mobile-only-btn"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-grey)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
              title="Close menu"
            >
              <style>{`
                @media (max-width: 767px) {
                  .mobile-only-btn { display: flex !important; }
                  .desktop-collapse-btn { display: none !important; }
                }
              `}</style>
              <X size={20} />
            </button>

            {/* On Desktop/Tablet: Collapse / Expand Button */}
            {!isCollapsed && (
              <button
                onClick={toggleCollapse}
                className="desktop-collapse-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-grey)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease'
                }}
                title="Collapse sidebar to icon rail"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
        </div>

        {/* If Collapsed, show Expand toggle at top */}
        {isCollapsed && (
          <div
            style={{
              padding: '8px 0',
              display: 'flex',
              justifyContent: 'center',
              borderBottom: '1px solid var(--color-border-subtle)'
            }}
          >
            <button
              onClick={toggleCollapse}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-grey)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease'
              }}
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* 2. Middle Body: Scrollable Navigation items */}
        <div style={{ flex: 1, padding: isCollapsed ? '10px 8px' : '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          
          {/* Main Navigation Group */}
          {!isCollapsed && <div className="section-label">Navigation</div>}
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`nav-item-btn ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed-btn' : ''}`}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon
                  size={19}
                  color={isActive ? 'var(--color-teal)' : 'var(--color-text-grey)'}
                  style={{ flexShrink: 0 }}
                />
                {!isCollapsed && (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {link.label}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tools & Features Group */}
          <div style={{ margin: '10px 0 4px', borderTop: '1px solid var(--color-border-subtle)' }} />
          {!isCollapsed && <div className="section-label">Tools & Audit</div>}

          {/* Judge Demo */}
          {onRunJudgeDemo && (
            <button
              onClick={() => {
                onRunJudgeDemo();
                setIsMobileOpen(false);
              }}
              className={`nav-item-btn ${isCollapsed ? 'collapsed-btn' : ''}`}
              style={{
                backgroundColor: isCollapsed ? 'transparent' : 'rgba(67, 143, 132, 0.12)',
                color: '#326D64',
                border: isCollapsed ? 'none' : '1px solid rgba(67, 143, 132, 0.35)'
              }}
              title={isCollapsed ? 'Judge Demo: Knee Replacement Scenario' : undefined}
            >
              <Sparkles size={18} color="#438F84" style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>Judge Demo</span>
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: '#438F84',
                    color: 'white',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    Scenario
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Trust Ledger */}
          {onOpenTrustDashboard && (
            <button
              onClick={() => {
                onOpenTrustDashboard();
                setIsMobileOpen(false);
              }}
              className={`nav-item-btn ${isCollapsed ? 'collapsed-btn' : ''}`}
              title={isCollapsed ? 'Trust Ledger & Data Freshness Audit' : undefined}
            >
              <ShieldCheck size={19} color="var(--color-teal)" style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Trust Ledger</span>
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'var(--color-mint)',
                    color: 'var(--color-teal-dark)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    Verified
                  </span>
                </div>
              )}
            </button>
          )}

          {/* CareSaathi Chat */}
          {onOpenChatDrawer && (
            <button
              onClick={() => {
                onOpenChatDrawer();
                setIsMobileOpen(false);
              }}
              className={`nav-item-btn ${isCollapsed ? 'collapsed-btn' : ''}`}
              title={isCollapsed ? 'CareSaathi AI Assistant Chat' : undefined}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MessageSquare size={19} color="#075E54" style={{ flexShrink: 0 }} />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '7px',
                  height: '7px',
                  backgroundColor: '#22C55E',
                  borderRadius: '50%',
                  border: '1.5px solid white'
                }} />
              </div>
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>CareSaathi Chat</span>
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: '#DCF8C6',
                    color: '#075E54',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    Online
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Saved Comparisons (if any) */}
          {savedComparisons && savedComparisons.length > 0 && onOpenSavedComparisons && (
            <button
              onClick={() => {
                onOpenSavedComparisons();
                setIsMobileOpen(false);
              }}
              className={`nav-item-btn ${isCollapsed ? 'collapsed-btn' : ''}`}
              title={isCollapsed ? `Saved Comparisons (${savedComparisons.length})` : undefined}
            >
              <Layers size={19} color="var(--color-teal)" style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Saved Comparisons</span>
                  <span style={{
                    fontSize: '0.68rem',
                    backgroundColor: 'var(--color-mint)',
                    color: 'var(--color-teal-dark)',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {savedComparisons.length}
                  </span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* 3. Footer: Language & Auth Profile */}
        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            padding: isCollapsed ? '12px 6px' : '12px 12px',
            backgroundColor: '#FAFAF7',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0
          }}
        >
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`nav-item-btn ${isCollapsed ? 'collapsed-btn' : ''}`}
              style={{
                padding: isCollapsed ? '8px 0' : '7px 10px',
                fontSize: '0.82rem',
                border: '1px solid var(--color-border)',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-sm)'
              }}
              title={isCollapsed ? `Language: ${language.toUpperCase()}` : undefined}
            >
              <Globe size={16} color="var(--color-text-grey)" style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ color: 'var(--color-navy)', fontWeight: 500 }}>
                    {language === 'en' ? 'English' : language === 'te' ? 'తెలుగు' : 'हिंदी'}
                  </span>
                  <ChevronRight size={14} color="#94A3B8" />
                </div>
              )}
            </button>

            {langDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: isCollapsed ? '100%' : '0',
                  marginBottom: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                  zIndex: 1000,
                  minWidth: '150px'
                }}
              >
                {[
                  { code: 'en', label: 'English' },
                  { code: 'te', label: 'తెలుగు (Telugu)' },
                  { code: 'hi', label: 'हिंदी (Hindi)' }
                ].map(l => (
                  <div
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code as any);
                      setLangDropdownOpen(false);
                    }}
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.84rem',
                      fontWeight: language === l.code ? 700 : 500,
                      backgroundColor: language === l.code ? 'var(--color-mint)' : 'transparent',
                      color: language === l.code ? 'var(--color-teal-dark)' : 'var(--color-navy)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{l.label}</span>
                    {language === l.code && <span style={{ color: 'var(--color-teal)' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Sign In / Profile */}
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                padding: isCollapsed ? '6px 0' : '6px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)'
              }}
              title={isCollapsed ? `${user.name || user.email} (Click to logout)` : undefined}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-teal)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.email?.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                      {user.email || 'Verified User'}
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={logout}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                setIsMobileOpen(false);
              }}
              className={`nav-item-btn ${isCollapsed ? 'collapsed-btn' : ''}`}
              style={{
                padding: isCollapsed ? '8px 0' : '8px 12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem'
              }}
              title={isCollapsed ? 'Sign In / Demo Login' : undefined}
            >
              <User size={17} color="var(--color-teal)" style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                  Sign In / Demo Login
                </span>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
