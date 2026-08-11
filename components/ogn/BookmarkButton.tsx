'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/ogn/utils';

interface BookmarkButtonProps {
  articleId: string;
  initialBookmarked?: boolean;
  showText?: boolean;
  variant?: 'default' | 'icon' | 'outline';
  className?: string;
}

export default function BookmarkButton({
  articleId,
  initialBookmarked = false,
  showText = true,
  variant = 'default',
  className,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  // Check initial state if session active
  useEffect(() => {
    let isMounted = true;
    if (!session) return;

    async function checkBookmark() {
      try {
        const res = await fetch(`/api/bookmarks?articleId=${articleId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setBookmarked(!!data.bookmarked);
        }
      } catch (err) {
        console.error('Error checking bookmark status:', err);
      }
    }
    checkBookmark();
    return () => {
      isMounted = false;
    };
  }, [articleId, session]);

  const handleToggleBookmark = async () => {
    if (!session) {
      if (confirm('Please log in to save bookmarks! Would you like to log in now?')) {
        router.push('/login');
      }
      return;
    }

    if (loading) return;

    // Optimistic UI update
    const previousBookmarked = bookmarked;
    const newBookmarked = !bookmarked;

    setBookmarked(newBookmarked);
    setLoading(true);

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      // Revert optimistic update
      setBookmarked(previousBookmarked);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 focus:outline-none';

  const variantClasses = {
    default:
      'rounded-xl px-3.5 py-2 text-xs font-semibold glass hover:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-slate-200 dark:border-slate-800',
    outline:
      'rounded-xl px-3 py-1.5 text-xs font-semibold border border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: 'p-2 rounded-full glass hover:bg-amber-500/10',
  };

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        bookmarked
          ? 'text-amber-600 dark:text-amber-400 font-bold'
          : 'text-slate-600 dark:text-slate-400 hover:text-amber-500',
        className
      )}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
      aria-label="Bookmark story"
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          bookmarked ? 'fill-amber-500 text-amber-500 scale-110' : 'text-current'
        )}
      />
      {showText && (
        <span className="text-xs font-semibold">
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  );
}
