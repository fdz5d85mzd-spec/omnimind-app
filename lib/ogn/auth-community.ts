import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { authOptions } from './auth';

export { authOptions };

export interface RegisterUserData {
  email: string;
  password: string;
  name?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
}

export interface UserProfileData {
  name?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
}

/**
 * Register a new user with email + password (hashed with bcrypt)
 * and create an associated user profile.
 */
export async function registerUser(data: RegisterUserData) {
  if (!data.email || !data.password) {
    throw new Error('Email and password are required');
  }

  const normalizedEmail = data.email.toLowerCase().trim();

  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user and profile
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name: data.name || data.displayName || normalizedEmail.split('@')[0],
      role: 'user',
      profile: {
        create: {
          displayName: data.displayName || data.name || normalizedEmail.split('@')[0],
          bio: data.bio || null,
          avatarUrl: data.avatarUrl || null,
          preferredLanguage: data.preferredLanguage || 'en',
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Fetch a full user profile including activity counts.
 */
export async function getUserProfile(userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      _count: {
        select: {
          comments: true,
          likes: true,
          bookmarks: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Ensure profile exists
  if (!user.profile) {
    const newProfile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        displayName: user.name || user.email.split('@')[0],
        preferredLanguage: 'en',
      },
    });
    user = { ...user, profile: newProfile };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    displayName: user.profile?.displayName || user.name || user.email.split('@')[0],
    bio: user.profile?.bio,
    avatarUrl: user.profile?.avatarUrl,
    preferredLanguage: user.profile?.preferredLanguage,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    stats: {
      commentsCount: user._count.comments,
      likesCount: user._count.likes,
      bookmarksCount: user._count.bookmarks,
    },
  };
}

/**
 * Update user name and profile details.
 */
export async function updateUserProfile(userId: string, data: UserProfileData) {
  // Update User name if provided
  if (data.name !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
    });
  }

  // Upsert UserProfile
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: data.displayName || data.name || null,
      bio: data.bio || null,
      avatarUrl: data.avatarUrl || null,
      preferredLanguage: data.preferredLanguage || 'en',
    },
    update: {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.preferredLanguage !== undefined && { preferredLanguage: data.preferredLanguage }),
    },
  });

  return getUserProfile(userId);
}
