import { redirect } from 'next/navigation';

/**
 * OGN now has its own complete production platform. Keep a single source of
 * truth instead of maintaining the older embedded OGN implementation here.
 */
export default function OgnPage() {
  redirect('https://ogn-platform.vercel.app');
}
