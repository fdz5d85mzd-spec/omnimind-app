'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Trash2,
  AlertCircle,
  Sparkles,
  User,
  Loader2,
} from 'lucide-react';
import { timeAgo } from '@/lib/ogn/utils';

interface CommentUser {
  id: string;
  name: string | null;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface CommentReply {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  parentId: string | null;
  status: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentItem {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  parentId: string | null;
  status: string;
  createdAt: string;
  user: CommentUser;
  replies?: CommentReply[];
}

interface CommentSectionProps {
  articleId: string;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Error loading comments');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (parentId?: string) => {
    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          content,
          parentId: parentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }

      await fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setDeletingId(commentId);
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      await fetchComments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  // Top-level comments
  const parentComments = comments.filter((c) => !c.parentId);
  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <section id="comments" className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Community Discussion
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {totalCount}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Comment Box */}
      {session ? (
        <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Post as {session.user?.name || session.user?.email}</span>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your positive thoughts or perspectives on this story..."
            rows={3}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />

          <div className="flex justify-end">
            <button
              onClick={() => handlePostComment()}
              disabled={submitting || !newComment.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl gradient-hope text-white text-xs font-semibold shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Want to join the conversation? Log in to comment and connect with the community.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl gradient-hope text-white text-xs font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <span>Log In to Comment</span>
          </Link>
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="flex justify-center items-center py-8 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : parentComments.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm italic">
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        <div className="space-y-6">
          {parentComments.map((comment) => {
            const authorName =
              comment.user.profile?.displayName ||
              comment.user.name ||
              'Community Member';
            const avatar = comment.user.profile?.avatarUrl;

            const isOwner = session?.user?.id === comment.userId;
            const isAdmin = (session?.user as any)?.role === 'admin';

            return (
              <div
                key={comment.id}
                className="glass rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                {/* Parent Comment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full gradient-hope flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={authorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {authorName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {timeAgo(comment.createdAt)}
                      </div>
                    </div>
                  </div>

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
                  {comment.content}
                </p>

                {/* Actions: Reply button */}
                {session && (
                  <div className="flex items-center space-x-4 pt-1">
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <CornerDownRight className="h-3.5 w-3.5" />
                      <span>{replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}</span>
                    </button>
                  </div>
                )}

                {/* Inline Reply Form */}
                {replyingTo === comment.id && (
                  <div className="pt-3 pl-4 border-l-2 border-amber-500/50 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${authorName}...`}
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostComment(comment.id)}
                        disabled={submitting || !replyText.trim()}
                        className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-xl gradient-hope text-white text-xs font-semibold shadow-sm hover:scale-105 transition-all disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies List */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3 pl-4 sm:pl-6 border-l-2 border-slate-200 dark:border-slate-800">
                    {comment.replies.map((reply) => {
                      const replyAuthor =
                        reply.user.profile?.displayName ||
                        reply.user.name ||
                        'Community Member';
                      const replyAvatar = reply.user.profile?.avatarUrl;
                      const isReplyOwner = session?.user?.id === reply.userId;

                      return (
                        <div key={reply.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300 overflow-hidden">
                                {replyAvatar ? (
                                  <img
                                    src={replyAvatar}
                                    alt={replyAuthor}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  replyAuthor.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                {replyAuthor}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {timeAgo(reply.createdAt)}
                              </span>
                            </div>

                            {(isReplyOwner || isAdmin) && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-slate-400 hover:text-rose-500 p-0.5"
                                title="Delete reply"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif pl-8">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
