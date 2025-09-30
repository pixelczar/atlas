import { Node, Edge } from 'reactflow';

/**
 * Custom Node Data for React Flow
 * Extends Firestore node data with UI state
 */
export interface IframeNodeData {
  // From Firestore
  url: string;
  thumbUrl: string | null;
  showIframe: boolean;
  title: string | null;
  description: string | null;
  parentId: string | null;

  // UI-specific
  isLoading?: boolean;
  hasError?: boolean;
  lastUpdatedBy?: string;
}

/**
 * React Flow Node with custom data
 */
export type SitemapNode = Node<IframeNodeData>;

/**
 * React Flow Edge with optional label
 */
export type SitemapEdge = Edge<{ label?: string }>;

/**
 * Graph State
 */
export interface GraphState {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  isLoading: boolean;
  error: string | null;
}
