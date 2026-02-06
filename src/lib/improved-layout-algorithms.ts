/**
 * IMPROVED LAYOUT ALGORITHMS - Better hierarchy recognition and sibling grouping
 */

import * as dagre from 'dagre';

export type LayoutType = 'grid' | 'depth-columns' | 'radial' | 'force' | 'tree' | 'dagre';

export interface LayoutOptions {
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  spacing?: number;
}

/**
 * SIMPLIFIED DAGRE LAYOUT - Much simpler and more reliable hierarchy
 */
export function calculateImprovedDagreLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 100,
  } = options;

  const positions = new Map();

  // Find root node
  const rootNode = nodes.find(node => {
    const url = node.data?.url;
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === '/' || urlObj.pathname === '';
    } catch {
      return false;
    }
  });

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: spacing + 80,
    marginx: 50,
    marginy: 50,
    ranker: 'network-simplex',
    align: 'UL',
    edgesep: 20,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add all nodes
  const urlToNode = new Map();
  nodes.forEach(node => {
    const url = node.data?.url;
    if (url) {
      urlToNode.set(url, node);
    }

    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight
    });
  });

  // Build edges
  nodes.forEach(node => {
    const nodeUrl = node.data?.url;
    if (!nodeUrl || !rootNode) return;

    try {
      const url = new URL(nodeUrl);
      const pathname = url.pathname;
      const segments = pathname.split('/').filter(Boolean);

      // Skip root node
      if (segments.length === 0) return;

      // Find parent by walking up the path
      let parentNode = null;
      for (let i = segments.length - 1; i >= 0; i--) {
        const parentPathSegments = segments.slice(0, i);
        const parentPath = parentPathSegments.length === 0 ? '/' : '/' + parentPathSegments.join('/');
        const parentUrl = url.origin + parentPath;

        parentNode = urlToNode.get(parentUrl);
        if (parentNode && parentNode.id !== node.id) {
          break;
        }
      }

      // If no parent found, connect to root
      if (!parentNode && node.id !== rootNode.id) {
        parentNode = rootNode;
      }

      if (parentNode && parentNode.id !== node.id) {
        g.setEdge(parentNode.id, node.id);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  // Run dagre layout
  dagre.layout(g);

  // Extract positions
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const x = dagreNode.x - nodeWidth / 2;
      const y = dagreNode.y - nodeHeight / 2;
      positions.set(node.id, { x, y });
    }
  });

  return positions;
}

/**
 * ENHANCED DAGRE LAYOUT - Much better hierarchy with proper deep nesting
 * This version actually creates deep hierarchies instead of just 2 levels
 */
export function calculateEnhancedDagreLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 100,
  } = options;

  const positions = new Map();

  // Find root node
  const rootNode = nodes.find(node => {
    const url = node.data?.url;
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === '/' || urlObj.pathname === '';
    } catch {
      return false;
    }
  });

  if (!rootNode) {
    return positions;
  }

  // Build URL hierarchy with proper depth analysis
  const urlToNode = new Map();
  const nodeDepths = new Map();

  nodes.forEach(node => {
    const url = node.data?.url;
    if (url) {
      urlToNode.set(url, node);
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split('/').filter(Boolean);
        nodeDepths.set(node.id, segments.length);
      } catch {
        nodeDepths.set(node.id, 0);
      }
    }
  });

  // Create dagre graph with optimized settings for deep hierarchies
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: spacing + 120,
    marginx: 60,
    marginy: 60,
    ranker: 'network-simplex',
    align: 'UL',
    edgesep: 30,
    acyclicer: 'greedy',
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add all nodes
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight
    });
  });

  // Build proper hierarchy edges
  const maxDepth = Math.max(...Array.from(nodeDepths.values()));

  // Connect nodes level by level
  for (let depth = 1; depth <= maxDepth; depth++) {
    const nodesAtDepth = nodes.filter(node => nodeDepths.get(node.id) === depth);

    nodesAtDepth.forEach(node => {
      const nodeUrl = node.data?.url;
      if (!nodeUrl) return;

      try {
        const url = new URL(nodeUrl);
        const pathname = url.pathname;
        const segments = pathname.split('/').filter(Boolean);

        // Find the closest existing parent
        let parentNode = null;
        let parentFound = false;

        // Try to find parent by progressively removing path segments
        for (let i = segments.length - 1; i >= 0; i--) {
          const parentPathSegments = segments.slice(0, i);
          const parentPath = parentPathSegments.length === 0 ? '/' : '/' + parentPathSegments.join('/');
          const parentUrl = url.origin + parentPath;

          parentNode = urlToNode.get(parentUrl);
          if (parentNode && parentNode.id !== node.id) {
            parentFound = true;
            break;
          }
        }

        // If no intermediate parent found, try to find the closest existing parent
        // by looking for any node that is a prefix of the current path
        if (!parentFound) {
          let bestParent = null;
          let bestMatchLength = 0;

          for (const [existingUrl, existingNode] of urlToNode.entries()) {
            if (existingNode.id === node.id) continue;

            try {
              const existingUrlObj = new URL(existingUrl);
              const existingPath = existingUrlObj.pathname;

              // Check if this existing path is a prefix of the current path
              if (pathname.startsWith(existingPath) && existingPath !== pathname) {
                const matchLength = existingPath.split('/').filter(Boolean).length;
                if (matchLength > bestMatchLength) {
                  bestParent = existingNode;
                  bestMatchLength = matchLength;
                }
              }
            } catch {
              // Skip invalid URLs
            }
          }

          if (bestParent) {
            parentNode = bestParent;
            parentFound = true;
          }
        }

        // If no parent found, connect to root
        if (!parentFound && node.id !== rootNode.id) {
          parentNode = rootNode;
        }

        if (parentNode && parentNode.id !== node.id) {
          g.setEdge(parentNode.id, node.id);
        }
      } catch {
        // Invalid URL, skip
      }
    });
  }

  // Run dagre layout
  dagre.layout(g);

  // Extract positions
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const x = dagreNode.x - nodeWidth / 2;
      const y = dagreNode.y - nodeHeight / 2;
      positions.set(node.id, { x, y });
    }
  });

  return positions;
}

/**
 * Build URL hierarchy from nodes
 */
function buildURLHierarchy(nodes: any[]): Map<string, any> {
  const hierarchy = new Map();

  // Sort nodes by URL depth (shallow to deep)
  const sortedNodes = nodes
    .filter(node => node.data?.url)
    .sort((a, b) => {
      const depthA = new URL(a.data.url).pathname.split('/').filter(Boolean).length;
      const depthB = new URL(b.data.url).pathname.split('/').filter(Boolean).length;
      return depthA - depthB;
    });

  sortedNodes.forEach(node => {
    const url = node.data.url;
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      const depth = segments.length;

      hierarchy.set(url, {
        url,
        title: node.data.title || node.data.label || '',
        depth,
        segments,
        children: []
      });
    } catch {
      // Invalid URL, skip
    }
  });

  // Build parent-child relationships
  hierarchy.forEach((node, url) => {
    if (node.depth > 0) {
      // Find parent by removing last segment
      const parentSegments = node.segments.slice(0, -1);
      const parentPath = parentSegments.length === 0 ? '/' : '/' + parentSegments.join('/');
      const parentUrl = new URL(url).origin + parentPath;

      const parent = hierarchy.get(parentUrl);
      if (parent) {
        parent.children.push(url);
        node.parent = parentUrl;
      }
    }
  });

  return hierarchy;
}

/**
 * TRUE ELK-STYLE LAYOUT - Depth-based positioning with proper layering
 * This creates a true hierarchical layout with multiple layers
 */
export function calculateElkLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 100,
  } = options;

  const positions = new Map();

  // Find root node
  const rootNode = nodes.find(node => {
    const url = node.data?.url;
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === '/' || urlObj.pathname === '';
    } catch {
      return false;
    }
  });

  if (!rootNode) {
    return positions;
  }

  // Build depth-based hierarchy
  const nodeDepths = new Map();
  const depthGroups = new Map();

  nodes.forEach(node => {
    const url = node.data?.url;
    if (url) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split('/').filter(Boolean);
        const depth = segments.length;

        nodeDepths.set(node.id, depth);

        if (!depthGroups.has(depth)) {
          depthGroups.set(depth, []);
        }
        depthGroups.get(depth).push(node);
      } catch {
        nodeDepths.set(node.id, 0);
      }
    }
  });

  const maxDepth = Math.max(...Array.from(nodeDepths.values()));

  // Position nodes by depth level
  let currentY = 100;

  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtDepth = depthGroups.get(depth) || [];
    if (nodesAtDepth.length === 0) continue;

    // Sort nodes within each depth level for consistent positioning
    nodesAtDepth.sort((a, b) => {
      const urlA = a.data?.url || '';
      const urlB = b.data?.url || '';
      return urlA.localeCompare(urlB);
    });

    // Calculate horizontal spacing
    const totalWidth = nodesAtDepth.length * nodeWidth + (nodesAtDepth.length - 1) * spacing;
    const startX = -totalWidth / 2;

    nodesAtDepth.forEach((node, index) => {
      const x = startX + index * (nodeWidth + spacing);
      positions.set(node.id, { x, y: currentY });
    });

    // Move to next level
    currentY += nodeHeight + spacing + 80;
  }

  return positions;
}
