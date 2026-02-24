import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getFreshness } from '../services/smsUtils';
import { Tooltip } from './ui';

interface HeaderProps {
  lastUpdated?: string | null;
}

const TABS = [
  { id: 'compare', label: 'Prices', href: '/compare' },
  { id: 'calculator', label: 'Calculator', href: '/calculator' },
  { id: 'analyze', label: 'Analyze', href: '/analyze' },
  { id: 'api-docs', label: 'API', href: '/api-docs' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
];

export const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const freshness = lastUpdated ? getFreshness(lastUpdated) : null;
  const activeTab = TABS.find((t) => location.pathname.startsWith(t.href))?.id ?? '';

  // Close mobile menu on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
  }, [mobileOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <>
      {/* Skip to content link (a11y) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-ink-border bg-white/80 dark:bg-ink/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="SMS Rates — Home">
              <MessageSquare className="w-6 h-6 text-brand-500" aria-hidden="true" />
              <span className="font-display font-bold text-lg tracking-tight">
                SMS<span className="text-brand-400">_RATES</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {TABS.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.href}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'bg-brand-500/10 text-brand-500 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Freshness badge */}
              {freshness && (
                <Tooltip
                  content="Prices are refreshed daily from each provider's API"
                  side="bottom"
                >
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-default">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${freshness.dotClass} ${freshness.level === 'live' ? 'animate-live' : ''}`}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="sr-only">Data last updated: </span>
                      {freshness.label}
                    </span>
                  </div>
                </Tooltip>
              )}

              {/* Theme toggle */}
              <Tooltip
                content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                side="bottom"
              >
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
                </button>
              </Tooltip>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <nav
              id="mobile-nav"
              className="md:hidden pb-3 border-t border-slate-200 dark:border-ink-border mt-1 pt-2"
              aria-label="Mobile navigation"
            >
              {TABS.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.href}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
    </>
  );
};
