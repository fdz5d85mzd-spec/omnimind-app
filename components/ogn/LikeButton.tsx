'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { cn, formatNumber } from '@/lib/ogn/utils';

interface LikeButtonProps {
  articleId: string;
  initialLikes?: number;
  initialLiked?: boolean;
  showCount?: boolean;
  variant?: 'default' | 'icon' | 'outline';
  className?: string;
}

export default function LikeButton({
  articleId,
  initialLikes = 0,
  initialLiked = false,
  showCount = true,
  variant = 'default',
  className,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  // Fetch status if initial state wasn't provided or user session active
  useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/likes?articleId=${articleId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setCount(data.count ?? 0);
          setLiked(!!data.liked);
        }
      } catch (err) {
        console.error('Error fetching likes:', err);
      }
    }
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [articleId, session]);

  const handleToggleLike = async () => {
    if (!session) {
      if (confirm('Please log in to like articles! Would you like to log in now?')) {
        router.push('/login');
      }
      return;
    }

    if (loading) return;

    // Optimistic UI update
    const previousLiked = liked;
    const previousCount = count;
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

    setLiked(newLiked);
    setCount(newCount);
    setLoading(true);

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert optimistic update
      setLiked(previousLiked);
      setCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 focus:outline-none';

  const variantClasses = {
    default:
      'rounded-xl px-3.5 py-2 text-xs font-semibold glass hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-slate-200 dark:border-slate-800',
    outline:
      'rounded-xl px-3 py-1.5 text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: 'p-2 rounded-full glass hover:bg-rose-500/10',
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        liked ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-rose-500',
        className
      )}
      title={liked ? 'Unlike this story' : 'Like this story'}
      aria-label="Like story"
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          liked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-current'
        )}
      />
      {showCount && (
        <span className="text-xs font-semibold">
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}
