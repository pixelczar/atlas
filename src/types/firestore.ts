import { Timestamp } from 'firebase/firestore';

/**
 * Project Document
 * Top-level collection for sitemap projects
 */
export interface Project {
  id: string;
  name: string;
  sitemapUrl: string;
  ownerId: string;
  settings: {
    autoLayout: boolean;
    theme: 'light' | 'dark';
    showMinimap: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Node Document
 * Represents a page in the sitemap
 * Maps to React Flow node
 */
export interface FirestoreNode {
  id: string;
  url: string;
  thumbUrl: string | null; // Firebase Storage URL
  position: {
    x: number;
    y: number;
  };
  showIframe: boolean; // Toggle between thumbnail and iframe
  title: string | null; // Page title from metadata
  description: string | null; // Meta description
  parentId: string | null; // For hierarchical sitemaps
  metadata: {
    lastModified: Timestamp;
    status: 'pending' | 'ready' | 'error';
    screenshotAt: Timestamp | null;
    updatedBy: string; // userId of last editor
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Edge Document
 * Represents connections between pages
 * Maps to React Flow edge
 */
export interface FirestoreEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  label: string | null; // Link text or description
  type: 'default' | 'smoothstep' | 'step';
  animated: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Presence Document
 * Tracks active users and their cursors
 */
export interface UserPresence {
  userId: string;
  name: string;
  email: string;
  photoURL: string | null;
  cursor: {
    x: number;
    y: number;
  } | null;
  color: string; // User's cursor color (hex)
  currentNode: string | null; // Node being viewed/edited
  lastSeen: Timestamp;
  isActive: boolean;
}
