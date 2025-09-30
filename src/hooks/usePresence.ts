'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserPresence } from '@/types/firestore';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

/**
 * Track user presence and cursor position
 * Updates Firestore with user activity
 *
 * @param projectId - Project ID
 * @param user - Current user info
 */
export function usePresence(projectId: string, user: UserInfo | null) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!projectId || !user) return;

    const presenceRef = doc(db, `projects/${projectId}/presence/${user.id}`);

    // Generate random color for user cursor
    const userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    // Set initial presence
    const setPresence = async () => {
      await setDoc(presenceRef, {
        userId: user.id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || null,
        cursor: null,
        color: userColor,
        currentNode: null,
        lastSeen: Timestamp.now(),
        isActive: true,
      });
    };

    setPresence();

    // Update lastSeen every 30 seconds
    const heartbeat = setInterval(async () => {
      await setDoc(
        presenceRef,
        {
          lastSeen: Timestamp.now(),
          isActive: true,
        },
        { merge: true }
      );
    }, 30000);

    // Subscribe to active users (within last 2 minutes)
    const twoMinutesAgo = Timestamp.fromMillis(Date.now() - 120000);
    const presenceQuery = query(
      collection(db, `projects/${projectId}/presence`),
      where('lastSeen', '>', twoMinutesAgo)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const users: UserPresence[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserPresence);
      });
      setActiveUsers(users.filter((u) => u.userId !== user.id));
    });

    // Cleanup: mark user as inactive
    return () => {
      clearInterval(heartbeat);
      unsubscribe();
      setDoc(
        presenceRef,
        {
          isActive: false,
          lastSeen: Timestamp.now(),
        },
        { merge: true }
      );
    };
  }, [projectId, user]);

  return { activeUsers };
}

/**
 * Update cursor position for presence
 */
export async function updateCursorPosition(
  projectId: string,
  userId: string,
  cursor: { x: number; y: number } | null
) {
  const presenceRef = doc(db, `projects/${projectId}/presence/${userId}`);

  await setDoc(
    presenceRef,
    {
      cursor,
      lastSeen: Timestamp.now(),
    },
    { merge: true }
  );
}
