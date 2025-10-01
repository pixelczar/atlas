/**
 * Layout Algorithms for Sitemap Visualization
 * Using dagre for professional hierarchical tree layouts
 */

import dagre from 'dagre';

export type LayoutType = 'grid' | 'depth-columns' | 'radial' | 'force' | 'tree' | 'dagre';

export interface LayoutOptions {
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  spacing?: number;
}

/**
 * GRID LAYOUT - Simple rows and columns
 * Clean and organized, easy to scan
 */
export function calculateGridLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    width = 1400,
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 40,
  } = options;

  const positions = new Map();
  
  // Calculate columns based on viewport width
  const columns = Math.max(1, Math.floor(width / (nodeWidth + spacing)));
  
  nodes.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    const x = 100 + (col * (nodeWidth + spacing));
    const y = 100 + (row * (nodeHeight + spacing));
    
    positions.set(node.id, { x, y });
  });
  
  return positions;
}

/**
 * DEPTH COLUMNS LAYOUT - Vertical columns by URL depth
 * Good for seeing hierarchy, but can get crowded
 */
export function calculateDepthColumnsLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 40,
  } = options;

  const positions = new Map();
  
  // Group by depth
  const depthGroups = new Map<number, any[]>();
  nodes.forEach(node => {
    const depth = node.data?.depth ?? 0;
    const group = depthGroups.get(depth) || [];
    group.push(node);
    depthGroups.set(depth, group);
  });

  // Sort within each depth group
  depthGroups.forEach(group => {
    group.sort((a, b) => (a.data?.url || '').localeCompare(b.data?.url || ''));
  });

  // Position nodes
  depthGroups.forEach((group, depth) => {
    const x = 100 + (depth * 450);
    
    group.forEach((node, index) => {
      const y = 100 + (index * (nodeHeight + spacing));
      positions.set(node.id, { x, y });
    });
  });
  
  return positions;
}

/**
 * RADIAL LAYOUT - Circular arrangement
 * Beautiful for smaller sitemaps, shows connections well
 */
export function calculateRadialLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    width = 1400,
    height = 800,
  } = options;

  const positions = new Map();
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Group by depth
  const depthGroups = new Map<number, any[]>();
  nodes.forEach(node => {
    const depth = node.data?.depth ?? 0;
    const group = depthGroups.get(depth) || [];
    group.push(node);
    depthGroups.set(depth, group);
  });

  const maxDepth = Math.max(...Array.from(depthGroups.keys()));
  
  depthGroups.forEach((group, depth) => {
    const radius = depth === 0 ? 0 : 200 + (depth * 250);
    const angleStep = (Math.PI * 2) / Math.max(group.length, 1);
    
    group.forEach((node, index) => {
      if (depth === 0) {
        // Center node
        positions.set(node.id, { x: centerX, y: centerY });
      } else {
        const angle = angleStep * index - Math.PI / 2; // Start from top
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.set(node.id, { x, y });
      }
    });
  });
  
  return positions;
}

/**
 * FORCE-DIRECTED LAYOUT - Physics-based
 * Natural clustering, but can be chaotic
 */
export function calculateForceLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    width = 1400,
    height = 800,
    nodeWidth = 288,
    spacing = 300,
  } = options;

  const positions = new Map();
  
  // Simple force simulation (simplified version)
  // For production, use d3-force or similar
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Initial random positions with some structure
  nodes.forEach((node, index) => {
    const depth = node.data?.depth ?? 0;
    const angle = (index / nodes.length) * Math.PI * 2;
    const radius = 200 + (depth * 150);
    
    // Add some randomness for natural feel
    const randomOffset = (Math.random() - 0.5) * 100;
    
    const x = centerX + Math.cos(angle) * radius + randomOffset;
    const y = centerY + Math.sin(angle) * radius + randomOffset;
    
    positions.set(node.id, { x, y });
  });
  
  return positions;
}

/**
 * TREE LAYOUT - Hierarchical tree (top to bottom)
 * Uses dagre for professional tree layout with proper parent-child centering
 * Perfect for sitemap visualization like the reference image
 */
export function calculateTreeLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 80,
  } = options;

  const positions = new Map();
  
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph direction (TB = top to bottom, like the reference image)
  g.setGraph({ 
    rankdir: 'TB',
    nodesep: spacing,      // Horizontal spacing between nodes
    ranksep: spacing + 40, // Vertical spacing between levels
    marginx: 50,
    marginy: 50,
  });
  
  // Default to use node label for sizing
  g.setDefaultEdgeLabel(() => ({}));
  
  // Build maps for URL to node lookups
  const urlToNode = new Map();
  nodes.forEach(node => {
    const url = node.data?.url;
    if (url) {
      urlToNode.set(url, node);
    }
    
    // Add node to dagre graph
    g.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    });
  });
  
  // Add edges based on parent-child relationships
  let edgesAdded = 0;
  nodes.forEach(node => {
    const parentId = node.data?.parentId;
    
    if (parentId) {
      // parentId is stored as the parent's URL - find the actual parent node
      const parentNode = urlToNode.get(parentId);
      if (parentNode && parentNode.id !== node.id) {
        g.setEdge(parentNode.id, node.id);
        edgesAdded++;
      }
    } else {
      // No parentId - use URL structure to determine hierarchy
      const nodeUrl = node.data?.url || '';
      const depth = node.data?.depth ?? 0;
      
      if (depth > 0 && nodeUrl) {
        try {
          const url = new URL(nodeUrl);
          const pathname = url.pathname;
          const segments = pathname.split('/').filter(Boolean);
          
          if (segments.length > 0) {
            // Find parent by removing last segment
            const parentPathSegments = segments.slice(0, -1);
            const parentPath = '/' + parentPathSegments.join('/');
            const parentUrl = url.origin + (parentPath === '/' ? '/' : parentPath);
            
            const parentNode = urlToNode.get(parentUrl);
            if (parentNode && parentNode.id !== node.id) {
              g.setEdge(parentNode.id, node.id);
              edgesAdded++;
            } else if (parentPathSegments.length === 0) {
              // Connect to root if no parent found
              const rootNode = urlToNode.get(url.origin + '/');
              if (rootNode && rootNode.id !== node.id) {
                g.setEdge(rootNode.id, node.id);
                edgesAdded++;
              }
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  });
  
  console.log(`🌲 Dagre layout: ${nodes.length} nodes, ${edgesAdded} edges`);
  
  // Run dagre layout algorithm
  dagre.layout(g);
  
  // Extract positions from dagre graph
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      // Dagre gives us center coordinates, adjust for top-left positioning
      positions.set(node.id, {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      });
    }
  });
  
  return positions;
}

/**
 * DAGRE LAYOUT - Professional graph layout (left to right)
 * Uses dagre with horizontal orientation for a different perspective
 * Great for wide hierarchies
 */
export function calculateDagreLayout(
  nodes: any[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeWidth = 288,
    nodeHeight = 200,
    spacing = 100,
  } = options;

  const positions = new Map();
  
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph direction (LR = left to right)
  g.setGraph({ 
    rankdir: 'LR',
    nodesep: spacing,      // Vertical spacing between nodes
    ranksep: spacing + 80, // Horizontal spacing between levels
    marginx: 50,
    marginy: 50,
  });
  
  // Default to use node label for sizing
  g.setDefaultEdgeLabel(() => ({}));
  
  // Build maps for URL to node lookups
  const urlToNode = new Map();
  nodes.forEach(node => {
    const url = node.data?.url;
    if (url) {
      urlToNode.set(url, node);
    }
    
    // Add node to dagre graph
    g.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    });
  });
  
  // Add edges based on parent-child relationships (same logic as tree)
  let edgesAdded = 0;
  nodes.forEach(node => {
    const parentId = node.data?.parentId;
    
    if (parentId) {
      const parentNode = urlToNode.get(parentId);
      if (parentNode && parentNode.id !== node.id) {
        g.setEdge(parentNode.id, node.id);
        edgesAdded++;
      }
    } else {
      const nodeUrl = node.data?.url || '';
      const depth = node.data?.depth ?? 0;
      
      if (depth > 0 && nodeUrl) {
        try {
          const url = new URL(nodeUrl);
          const pathname = url.pathname;
          const segments = pathname.split('/').filter(Boolean);
          
          if (segments.length > 0) {
            const parentPathSegments = segments.slice(0, -1);
            const parentPath = '/' + parentPathSegments.join('/');
            const parentUrl = url.origin + (parentPath === '/' ? '/' : parentPath);
            
            const parentNode = urlToNode.get(parentUrl);
            if (parentNode && parentNode.id !== node.id) {
              g.setEdge(parentNode.id, node.id);
              edgesAdded++;
            } else if (parentPathSegments.length === 0) {
              const rootNode = urlToNode.get(url.origin + '/');
              if (rootNode && rootNode.id !== node.id) {
                g.setEdge(rootNode.id, node.id);
                edgesAdded++;
              }
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  });
  
  console.log(`🔀 Dagre (LR) layout: ${nodes.length} nodes, ${edgesAdded} edges`);
  
  // Run dagre layout algorithm
  dagre.layout(g);
  
  // Extract positions from dagre graph
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      positions.set(node.id, {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      });
    }
  });
  
  return positions;
}

/**
 * Apply a layout algorithm to nodes
 */
export function applyLayout(
  nodes: any[],
  layoutType: LayoutType,
  options: LayoutOptions = {}
): any[] {
  let positions: Map<string, { x: number; y: number }>;
  
  switch (layoutType) {
    case 'grid':
      positions = calculateGridLayout(nodes, options);
      break;
    case 'depth-columns':
      positions = calculateDepthColumnsLayout(nodes, options);
      break;
    case 'radial':
      positions = calculateRadialLayout(nodes, options);
      break;
    case 'force':
      positions = calculateForceLayout(nodes, options);
      break;
    case 'tree':
      positions = calculateTreeLayout(nodes, options);
      break;
    case 'dagre':
      positions = calculateDagreLayout(nodes, options);
      break;
    default:
      positions = calculateGridLayout(nodes, options);
  }
  
  // Apply positions to nodes
  return nodes.map(node => {
    const position = positions.get(node.id);
    if (position) {
      return {
        ...node,
        position,
      };
    }
    return node;
  });
}

/**
 * Get display name for layout type
 */
export function getLayoutName(type: LayoutType): string {
  const names: Record<LayoutType, string> = {
    'grid': 'Grid',
    'depth-columns': 'Depth Columns',
    'radial': 'Radial',
    'force': 'Force',
    'tree': 'Tree',
  };
  return names[type];
}

/**
 * Get icon for layout type (lucide icon name)
 */
export function getLayoutIcon(type: LayoutType): string {
  const icons: Record<LayoutType, string> = {
    'grid': 'Grid3x3',
    'depth-columns': 'Columns',
    'radial': 'CircleDot',
    'force': 'Sparkles',
    'tree': 'GitBranch',
  };
  return icons[type];
}

