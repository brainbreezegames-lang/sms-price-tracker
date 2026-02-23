import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getFreshness } from '../services/smsUtils';

interface HeaderProps {
  lastUpdated?: string | null;
}

const TABS = [
  { id: 'compare', label: 'Prices', href: '/compare' },
  { id: 'trends', label: 'Trends', href: '/trends' },
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'about', label: 'About', href: '/about' },
];

export const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const freshness = lastUpdated ? getFreshness(lastUpdated) : null;

  const activeTab = TABS.find((t) => location.pathname.startsWith(t.href))?.id ?? '';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-ink-border bg-white/80 dark:bg-ink/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <MessageSquare className="w-6 h-6 text-brand-500" />
            <span className="font-display font-bold text-lg tracking-tight">
              SMS<span className="text-brand-400">_RATES</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
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
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${freshness.dotClass} ${freshness.level === 'live' ? 'animate-live' : ''}`} />
                <span>{freshness.label}</span>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-3 border-t border-slate-200 dark:border-ink-border mt-1 pt-2">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => setMobileOpen(false)}
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
  );
};
