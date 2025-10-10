/**
 * Layout Algorithms for Sitemap Visualization
 * Using dagre for professional hierarchical tree layouts
 */

import * as dagre from 'dagre';
import { calculateImprovedDagreLayout, calculateEnhancedDagreLayout, calculateElkLayout } from './improved-layout-algorithms';

export type LayoutType = 'grid' | 'depth-columns' | 'radial' | 'force' | 'tree' | 'dagre' | 'elk';

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
    spacing = 100,
  } = options;

  const positions = new Map();
  
  // Find the root URL (home page) - it should be at the top
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
  
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph direction (TB = top to bottom, like the reference image)
  g.setGraph({ 
    rankdir: 'TB',
    nodesep: 20,           // Much tighter horizontal spacing for sibling clustering
    ranksep: spacing + 60, // Vertical spacing between levels
    marginx: 30,
    marginy: 30,
    // Use network-simplex for better deep hierarchy support
    ranker: 'network-simplex',
    align: 'UL', // Align to upper left
    // Remove acyclicer to allow proper hierarchy
    edgesep: 10, // Minimum edge separation
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
      
      if (nodeUrl) {
        try {
          const url = new URL(nodeUrl);
          const pathname = url.pathname;
          const segments = pathname.split('/').filter(Boolean);
          
          if (segments.length > 0) {
            // Build proper hierarchy by finding the closest existing parent
            let parentNode = null;
            
            // Try to find parent by progressively removing path segments
            // Start from the most specific parent and work up
            for (let i = segments.length - 1; i >= 0; i--) {
              const parentPathSegments = segments.slice(0, i);
              const parentPath = parentPathSegments.length === 0 ? '/' : '/' + parentPathSegments.join('/');
              const parentUrl = url.origin + parentPath;
              
              parentNode = urlToNode.get(parentUrl);
              if (parentNode && parentNode.id !== node.id) {
                console.log(`🔗 Tree: Found parent for ${nodeUrl}: ${parentUrl} (depth: ${i})`);
                break;
              }
            }
            
            // If no intermediate parent found, try to find the closest existing parent
            // by looking for any node that is a prefix of the current path
            if (!parentNode) {
              console.log(`🔍 Tree: No exact parent found, looking for closest existing parent...`);
              
              // Find all existing nodes and check if any is a prefix of current path
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
                      console.log(`🎯 Tree: Found better parent: ${existingUrl} (match length: ${matchLength})`);
                    }
                  }
                } catch (e) {
                  // Skip invalid URLs
                }
              }
              
              if (bestParent) {
                parentNode = bestParent;
                console.log(`✅ Tree: Using closest parent: ${bestParent.data?.url}`);
              }
            }
            
            // If no intermediate parent found, connect to root
            if (!parentNode && rootNode && node.id !== rootNode.id) {
              parentNode = rootNode;
              console.log(`🔗 Tree: Connecting ${nodeUrl} to root (no intermediate parent found)`);
            }
            
            if (parentNode && parentNode.id !== node.id) {
              g.setEdge(parentNode.id, node.id);
              edgesAdded++;
              console.log(`✅ Tree: Added edge from ${parentNode.data?.url} to ${nodeUrl}`);
            }
          } else if (node.id !== rootNode?.id) {
            // This is a root-level page, connect to root if it's not the root itself
            if (rootNode) {
              g.setEdge(rootNode.id, node.id);
              edgesAdded++;
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      } else if (rootNode && node.id !== rootNode.id) {
        // If no URL and this is not the root node, connect to root
        g.setEdge(rootNode.id, node.id);
        edgesAdded++;
      }
    }
  });
  
  console.log(`🌲 Tree layout: ${nodes.length} nodes, ${edgesAdded} edges`);
  if (rootNode) {
    console.log(`🏠 Root node found: ${rootNode.data?.url}`);
  }
  
  // Debug: Log all node URLs to see what we're working with
  console.log('📋 All node URLs:');
  nodes.forEach(node => {
    console.log(`  - ${node.data?.url} (depth: ${node.data?.depth})`);
  });
  
  // Run dagre layout algorithm
  dagre.layout(g);
  
  // Extract positions from dagre graph
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const x = dagreNode.x - nodeWidth / 2;
      const y = dagreNode.y - nodeHeight / 2;
      
      positions.set(node.id, { x, y });
      
      // Debug: Log node positions
      console.log(`📍 Layout Node ${node.id}: (${x}, ${y}) - URL: ${node.data?.url}`);
      
      // Track bounds for centering
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + nodeWidth);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + nodeHeight);
    }
  });
  
  // Post-process to cluster siblings together and eliminate gaps
  const siblingClusters = new Map();
  
  // Group nodes by their parent and level
  nodes.forEach(node => {
    const parentId = node.data?.parentId;
    if (parentId) {
      const nodePos = positions.get(node.id);
      if (nodePos) {
        const key = `${parentId}-${Math.round(nodePos.y / 50) * 50}`; // Group by parent and y level
        if (!siblingClusters.has(key)) {
          siblingClusters.set(key, []);
        }
        siblingClusters.get(key).push(node);
      }
    }
  });
  
  // Re-cluster siblings to eliminate gaps
  siblingClusters.forEach((siblings, key) => {
    if (siblings.length > 1) {
      // Sort siblings by their current x position
      siblings.sort((a, b) => {
        const posA = positions.get(a.id);
        const posB = positions.get(b.id);
        return (posA?.x || 0) - (posB?.x || 0);
      });
      
      // Find the leftmost position of the first sibling
      const firstSibling = siblings[0];
      const firstPos = positions.get(firstSibling.id);
      if (firstPos) {
        let currentX = firstPos.x;
        
        // Position each sibling close to the previous one
        siblings.forEach((sibling, index) => {
          if (index > 0) {
            currentX += nodeWidth + 20; // Tight spacing between siblings
            positions.set(sibling.id, {
              x: currentX,
              y: firstPos.y, // Keep same y level
            });
          }
        });
        
        console.log(`🎯 Tree: Clustered ${siblings.length} siblings for ${key}`);
      }
    }
  });
  
  // Recalculate bounds after sibling clustering
  minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + nodeWidth);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + nodeHeight);
  });
  
  // Center the entire graph in the viewport
  if (positions.size > 0) {
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const centerX = (options.width || window.innerWidth) / 2;
    const centerY = (options.height || window.innerHeight) / 2;
    const offsetX = centerX - (minX + graphWidth / 2);
    const offsetY = centerY - (minY + graphHeight / 2);
    
    console.log(`🎯 Centering Tree layout: graph(${graphWidth}x${graphHeight}) at (${centerX}, ${centerY})`);
    
    // Apply centering offset to all positions
    positions.forEach((pos, nodeId) => {
      positions.set(nodeId, {
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      });
    });
  }
  
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
  
  // Find the root URL (home page) - it should be at the leftmost position
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
  
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph direction (TB = top to bottom)
  g.setGraph({ 
    rankdir: 'TB',
    nodesep: 20,           // Much tighter horizontal spacing for sibling clustering
    ranksep: spacing + 100, // Vertical spacing between levels
    marginx: 30,
    marginy: 30,
    // Use network-simplex for better deep hierarchy support
    ranker: 'network-simplex',
    align: 'UL', // Align to upper left
    // Remove acyclicer to allow proper hierarchy
    edgesep: 10, // Minimum edge separation
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
      
      if (nodeUrl) {
        try {
          const url = new URL(nodeUrl);
          const pathname = url.pathname;
          const segments = pathname.split('/').filter(Boolean);
          
          if (segments.length > 0) {
            // Build proper hierarchy by finding the closest existing parent
            let parentNode = null;
            
            // Try to find parent by progressively removing path segments
            // Start from the most specific parent and work up
            for (let i = segments.length - 1; i >= 0; i--) {
              const parentPathSegments = segments.slice(0, i);
              const parentPath = parentPathSegments.length === 0 ? '/' : '/' + parentPathSegments.join('/');
              const parentUrl = url.origin + parentPath;
              
              parentNode = urlToNode.get(parentUrl);
              if (parentNode && parentNode.id !== node.id) {
                console.log(`🔗 Dagre: Found parent for ${nodeUrl}: ${parentUrl} (depth: ${i})`);
                break;
              }
            }
            
            // If no intermediate parent found, try to find the closest existing parent
            // by looking for any node that is a prefix of the current path
            if (!parentNode) {
              console.log(`🔍 Dagre: No exact parent found, looking for closest existing parent...`);
              
              // Find all existing nodes and check if any is a prefix of current path
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
                      console.log(`🎯 Dagre: Found better parent: ${existingUrl} (match length: ${matchLength})`);
                    }
                  }
                } catch (e) {
                  // Skip invalid URLs
                }
              }
              
              if (bestParent) {
                parentNode = bestParent;
                console.log(`✅ Dagre: Using closest parent: ${bestParent.data?.url}`);
              }
            }
            
            // If no intermediate parent found, connect to root
            if (!parentNode && rootNode && node.id !== rootNode.id) {
              parentNode = rootNode;
              console.log(`🔗 Dagre: Connecting ${nodeUrl} to root (no intermediate parent found)`);
            }
            
            if (parentNode && parentNode.id !== node.id) {
              g.setEdge(parentNode.id, node.id);
              edgesAdded++;
              console.log(`✅ Dagre: Added edge from ${parentNode.data?.url} to ${nodeUrl}`);
            }
          } else if (node.id !== rootNode?.id) {
            // This is a root-level page, connect to root if it's not the root itself
            if (rootNode) {
              g.setEdge(rootNode.id, node.id);
              edgesAdded++;
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      } else if (rootNode && node.id !== rootNode.id) {
        // If no URL and this is not the root node, connect to root
        g.setEdge(rootNode.id, node.id);
        edgesAdded++;
      }
    }
  });
  
  console.log(`🔀 Dagre (TB) layout: ${nodes.length} nodes, ${edgesAdded} edges`);
  if (rootNode) {
    console.log(`🏠 Root node found: ${rootNode.data?.url}`);
  }
  
  // Debug: Check if we have proper hierarchy
  console.log('🔍 Hierarchy Debug:');
  nodes.forEach(node => {
    const parentId = node.data?.parentId;
    const url = node.data?.url;
    console.log(`  Node: ${url}`);
    console.log(`    Parent ID: ${parentId}`);
    console.log(`    Has parent: ${!!parentId}`);
  });
  
  // Debug: Log all node URLs to see what we're working with
  console.log('📋 All node URLs:');
  nodes.forEach(node => {
    console.log(`  - ${node.data?.url} (depth: ${node.data?.depth})`);
  });
  
  // Debug: Log sibling relationships
  console.log('👥 Sibling relationships:');
  const parentToChildren = new Map();
  nodes.forEach(node => {
    const parentId = node.data?.parentId;
    if (parentId) {
      if (!parentToChildren.has(parentId)) {
        parentToChildren.set(parentId, []);
      }
      parentToChildren.get(parentId).push(node.data?.url);
    }
  });
  
  parentToChildren.forEach((children, parentUrl) => {
    if (children.length > 1) {
      console.log(`  ${parentUrl} has ${children.length} children:`, children);
      // Log the specific case we're trying to fix
      if (parentUrl.includes('/resources')) {
        console.log(`🎯 RESOURCES CHILDREN: ${children.join(', ')}`);
      }
    }
  });
  
  // Debug: Check graph structure before layout
  console.log('🔍 Graph structure before layout:');
  console.log(`  Nodes: ${g.nodeCount()}`);
  console.log(`  Edges: ${g.edgeCount()}`);
  
  // Check if graph is connected
  const components = dagre.graphlib.alg.components(g);
  console.log(`  Connected components: ${components.length}`);
  
  // Debug: Log all edges in the graph
  console.log('🔗 Edges in dagre graph:');
  g.edges().forEach((edge, index) => {
    console.log(`  Edge ${index + 1}: ${edge.v} -> ${edge.w}`);
  });
  
  // Run dagre layout algorithm
  dagre.layout(g);
  
  // Extract positions from dagre graph
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const x = dagreNode.x - nodeWidth / 2;
      const y = dagreNode.y - nodeHeight / 2;
      
      positions.set(node.id, { x, y });
      
      // Debug: Log node positions
      console.log(`📍 Layout Node ${node.id}: (${x}, ${y}) - URL: ${node.data?.url}`);
      
      // Track bounds for centering
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + nodeWidth);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + nodeHeight);
    }
  });
  
  // Post-process to cluster siblings together and eliminate gaps
  const siblingClusters = new Map();
  
  // Group nodes by their parent and level
  nodes.forEach(node => {
    const parentId = node.data?.parentId;
    if (parentId) {
      const nodePos = positions.get(node.id);
      if (nodePos) {
        const key = `${parentId}-${Math.round(nodePos.y / 50) * 50}`; // Group by parent and y level
        if (!siblingClusters.has(key)) {
          siblingClusters.set(key, []);
        }
        siblingClusters.get(key).push(node);
      }
    }
  });
  
  // Re-cluster siblings to eliminate gaps
  siblingClusters.forEach((siblings, key) => {
    if (siblings.length > 1) {
      // Sort siblings by their current x position
      siblings.sort((a, b) => {
        const posA = positions.get(a.id);
        const posB = positions.get(b.id);
        return (posA?.x || 0) - (posB?.x || 0);
      });
      
      // Find the leftmost position of the first sibling
      const firstSibling = siblings[0];
      const firstPos = positions.get(firstSibling.id);
      if (firstPos) {
        let currentX = firstPos.x;
        
        // Position each sibling close to the previous one
        siblings.forEach((sibling, index) => {
          if (index > 0) {
            currentX += nodeWidth + 20; // Tight spacing between siblings
            positions.set(sibling.id, {
              x: currentX,
              y: firstPos.y, // Keep same y level
            });
          }
        });
        
        console.log(`🎯 Clustered ${siblings.length} siblings for ${key}`);
      }
    }
  });
  
  // Recalculate bounds after sibling clustering
  minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + nodeWidth);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + nodeHeight);
  });
  
  // Center the entire graph in the viewport
  if (positions.size > 0) {
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const centerX = (options.width || window.innerWidth) / 2;
    const centerY = (options.height || window.innerHeight) / 2;
    const offsetX = centerX - (minX + graphWidth / 2);
    const offsetY = centerY - (minY + graphHeight / 2);
    
    console.log(`🎯 Centering Dagre layout: graph(${graphWidth}x${graphHeight}) at (${centerX}, ${centerY})`);
    
    // Apply centering offset to all positions
    positions.forEach((pos, nodeId) => {
      positions.set(nodeId, {
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      });
    });
  }
  
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
      positions = calculateImprovedDagreLayout(nodes, options);
      break;
    case 'elk':
      positions = calculateElkLayout(nodes, options);
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
    'dagre': 'Dagre',
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
    'dagre': 'Network',
  };
  return icons[type];
}

