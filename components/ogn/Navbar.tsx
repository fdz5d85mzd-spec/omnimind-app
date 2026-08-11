'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles, Menu, X, Shield, Compass, Home, Info, Video, Headphones, Code, MessageSquare } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hope shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight gradient-text">
              OGN
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-ogn-gold dark:hover:text-ogn-gold transition-colors"
            >
              Home
            </Link>
            <Link
              href="/category"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-ogn-gold dark:hover:text-ogn-gold transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Community
            </Link>
            <Link
              href="/tv"
              className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <Video className="h-3.5 w-3.5" /> TV
            </Link>
            <Link
              href="/radio"
              className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
            >
              <Headphones className="h-3.5 w-3.5" /> Radio
            </Link>
            <Link
              href="/api-docs"
              className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-ogn-teal dark:hover:text-ogn-tealLight transition-colors"
            >
              <Code className="h-3.5 w-3.5" /> API
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-ogn-gold dark:hover:text-ogn-gold transition-colors"
            >
              About
            </Link>
            {session && (
              <Link
                href="/admin"
                className="flex items-center space-x-1 text-sm font-semibold text-ogn-teal hover:text-ogn-tealLight transition-colors px-3 py-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/20"
              >
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Actions (Dark Mode Toggle & Mobile Menu) */}
          <div className="flex items-center space-x-3">
            <DarkModeToggle />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-strong border-t border-white/20 dark:border-white/10 px-4 pt-3 pb-6 space-y-2 animate-fade-in">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Home className="h-5 w-5 text-ogn-gold" />
            <span>Home</span>
          </Link>
          <Link
            href="/category"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Compass className="h-5 w-5 text-ogn-teal" />
            <span>Categories</span>
          </Link>
          <Link
            href="/community"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-amber-500" />
            <span>Community</span>
          </Link>
          <Link
            href="/tv"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Video className="h-5 w-5 text-red-500" />
            <span>OGN TV</span>
          </Link>
          <Link
            href="/radio"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Headphones className="h-5 w-5 text-purple-500" />
            <span>OGN Radio</span>
          </Link>
          <Link
            href="/api-docs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Code className="h-5 w-5 text-ogn-teal" />
            <span>API Docs</span>
          </Link>
          <Link
            href="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Info className="h-5 w-5 text-indigo-500" />
            <span>About</span>
          </Link>
          {session && (
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium text-ogn-teal hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Shield className="h-5 w-5 text-ogn-teal" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
