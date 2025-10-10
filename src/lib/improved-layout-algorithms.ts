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
  
  console.log(`🌳 Starting dagre layout with ${nodes.length} nodes`);
  if (rootNode) {
    console.log(`🏠 Root node: ${rootNode.data?.url}`);
  }
  
  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB',
    nodesep: 50,
    ranksep: spacing + 80,
    marginx: 50,
    marginy: 50,
    ranker: 'network-simplex',  // Better for deep hierarchies than tight-tree
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
  
  // Build edges - much simpler approach
  let edgesAdded = 0;
  
  // Debug: Log all URLs and their depths
  console.log('🔍 URL Analysis:');
  nodes.forEach(node => {
    const nodeUrl = node.data?.url;
    if (nodeUrl) {
      try {
        const url = new URL(nodeUrl);
        const pathname = url.pathname;
        const segments = pathname.split('/').filter(Boolean);
        console.log(`  ${nodeUrl} -> depth: ${segments.length}, segments: [${segments.join(', ')}]`);
      } catch (e) {
        console.log(`  ${nodeUrl} -> invalid URL`);
      }
    }
  });
  
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
          console.log(`🔗 ${nodeUrl} -> ${parentUrl} (depth: ${i})`);
          break;
        }
      }
      
      // If no parent found, connect to root
      if (!parentNode && node.id !== rootNode.id) {
        parentNode = rootNode;
        console.log(`🔗 ${nodeUrl} -> root`);
      }
      
      if (parentNode && parentNode.id !== node.id) {
        g.setEdge(parentNode.id, node.id);
        edgesAdded++;
      }
    } catch (e) {
      console.log(`❌ Invalid URL: ${nodeUrl}`);
    }
  });
  
  console.log(`🌳 Added ${edgesAdded} edges`);
  
  // Run dagre layout
  dagre.layout(g);
  
  // Extract positions
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const x = dagreNode.x - nodeWidth / 2;
      const y = dagreNode.y - nodeHeight / 2;
      positions.set(node.id, { x, y });
      console.log(`📍 ${node.data?.url}: (${x}, ${y})`);
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
  
  console.log(`🌳 Enhanced Dagre layout with ${nodes.length} nodes`);
  
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
    console.log('❌ No root node found');
    return positions;
  }
  
  // Build URL hierarchy with proper depth analysis
  const urlToNode = new Map();
  const nodeDepths = new Map();
  
  console.log('🔍 DETAILED URL ANALYSIS:');
  nodes.forEach(node => {
    const url = node.data?.url;
    if (url) {
      urlToNode.set(url, node);
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split('/').filter(Boolean);
        nodeDepths.set(node.id, segments.length);
        console.log(`📊 ${url}`);
        console.log(`   -> pathname: "${pathname}"`);
        console.log(`   -> segments: [${segments.join(', ')}]`);
        console.log(`   -> depth: ${segments.length}`);
        console.log(`   -> nodeId: ${node.id}`);
        console.log('---');
      } catch (e) {
        nodeDepths.set(node.id, 0);
        console.log(`❌ Invalid URL: ${url}`);
      }
    }
  });
  
  // Create dagre graph with optimized settings for deep hierarchies
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB',                    // Top to bottom
    nodesep: 60,                     // Horizontal spacing between siblings
    ranksep: spacing + 120,          // Vertical spacing between levels (much larger)
    marginx: 60,
    marginy: 60,
    ranker: 'network-simplex',       // Better for complex hierarchies
    align: 'UL',                     // Align to upper left
    edgesep: 30,                     // Edge separation
    acyclicer: 'greedy',             // Handle cycles
    // Force proper layering
    'elk.layered.spacing.nodeNodeBetweenLayers': (spacing + 100).toString(),
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
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
  let edgesAdded = 0;
  const maxDepth = Math.max(...Array.from(nodeDepths.values()));
  console.log(`📊 Max depth in hierarchy: ${maxDepth}`);
  
  // Connect nodes level by level
  console.log(`🔗 BUILDING HIERARCHY: Max depth = ${maxDepth}`);
  for (let depth = 1; depth <= maxDepth; depth++) {
    const nodesAtDepth = nodes.filter(node => nodeDepths.get(node.id) === depth);
    console.log(`🔗 Processing depth ${depth}: ${nodesAtDepth.length} nodes`);
    
    nodesAtDepth.forEach(node => {
      const nodeUrl = node.data?.url;
      if (!nodeUrl) return;
      
      console.log(`\n🔍 Processing node: ${nodeUrl} (depth: ${depth})`);
      
      try {
        const url = new URL(nodeUrl);
        const pathname = url.pathname;
        const segments = pathname.split('/').filter(Boolean);
        
        console.log(`   -> segments: [${segments.join(', ')}]`);
        
        // Find the closest existing parent
        let parentNode = null;
        let parentFound = false;
        
        // Try to find parent by progressively removing path segments
        // Start from the most specific parent and work up
        for (let i = segments.length - 1; i >= 0; i--) {
          const parentPathSegments = segments.slice(0, i);
          const parentPath = parentPathSegments.length === 0 ? '/' : '/' + parentPathSegments.join('/');
          const parentUrl = url.origin + parentPath;
          
          console.log(`   -> checking parent at depth ${i}: ${parentUrl}`);
          
          parentNode = urlToNode.get(parentUrl);
          if (parentNode && parentNode.id !== node.id) {
            console.log(`   ✅ Found parent: ${parentUrl} (depth: ${i})`);
            parentFound = true;
            break;
          } else {
            console.log(`   ❌ Parent not found: ${parentUrl}`);
          }
        }
        
        // If no intermediate parent found, try to find the closest existing parent
        // by looking for any node that is a prefix of the current path
        if (!parentFound) {
          console.log(`   🔍 No exact parent found, looking for closest existing parent...`);
          
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
                  console.log(`   🎯 Found better parent: ${existingUrl} (match length: ${matchLength})`);
                }
              }
            } catch (e) {
              // Skip invalid URLs
            }
          }
          
          if (bestParent) {
            parentNode = bestParent;
            parentFound = true;
            console.log(`   ✅ Using closest parent: ${bestParent.data?.url}`);
          }
        }
        
        // If no parent found, connect to root
        if (!parentFound && node.id !== rootNode.id) {
          parentNode = rootNode;
          console.log(`   🔗 Connecting to root: ${rootNode.data?.url}`);
        }
        
        if (parentNode && parentNode.id !== node.id) {
          g.setEdge(parentNode.id, node.id);
          edgesAdded++;
          console.log(`   ✅ Added edge: ${parentNode.data?.url} -> ${nodeUrl}`);
        } else {
          console.log(`   ❌ No edge added for ${nodeUrl}`);
        }
      } catch (e) {
        console.log(`❌ Invalid URL: ${nodeUrl} - ${e.message}`);
      }
    });
  }
  
  console.log(`🌳 Added ${edgesAdded} edges for deep hierarchy`);
  
  // Debug: Show final graph structure
  console.log('🔍 FINAL GRAPH STRUCTURE:');
  console.log(`   Nodes: ${g.nodeCount()}`);
  console.log(`   Edges: ${g.edgeCount()}`);
  
  const edges = g.edges();
  console.log('   Edges in graph:');
  edges.forEach((edge, index) => {
    const sourceNode = nodes.find(n => n.id === edge.v);
    const targetNode = nodes.find(n => n.id === edge.w);
    console.log(`     ${index + 1}. ${sourceNode?.data?.url} -> ${targetNode?.data?.url}`);
  });
  
  // Run dagre layout
  console.log('🌳 Running dagre layout...');
  dagre.layout(g);
  
  // Extract positions
  console.log('📍 FINAL POSITIONS:');
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const x = dagreNode.x - nodeWidth / 2;
      const y = dagreNode.y - nodeHeight / 2;
      positions.set(node.id, { x, y });
      const depth = nodeDepths.get(node.id);
      console.log(`   ${node.data?.url}: (${x}, ${y}) depth: ${depth}`);
    }
  });
  
  // Group by Y position to see levels
  const yGroups = new Map();
  positions.forEach((pos, nodeId) => {
    const yLevel = Math.round(pos.y / 100) * 100; // Group by 100px intervals
    if (!yGroups.has(yLevel)) {
      yGroups.set(yLevel, []);
    }
    yGroups.get(yLevel).push({ nodeId, pos });
  });
  
  console.log('📊 HIERARCHY LEVELS (by Y position):');
  const sortedLevels = Array.from(yGroups.entries()).sort((a, b) => a[0] - b[0]);
  sortedLevels.forEach(([yLevel, nodes]) => {
    console.log(`   Level ${yLevel}: ${nodes.length} nodes`);
    nodes.forEach(({ nodeId, pos }) => {
      const node = nodes.find(n => n.id === nodeId);
      const depth = nodeDepths.get(nodeId);
      console.log(`     - ${node?.data?.url} (depth: ${depth})`);
    });
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
    } catch (e) {
      console.log(`❌ Invalid URL in hierarchy: ${url}`);
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
  
  console.log(`🌳 ELK-style layout with ${nodes.length} nodes`);
  
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
    console.log('❌ No root node found');
    return positions;
  }
  
  // Build depth-based hierarchy
  const nodeDepths = new Map();
  const depthGroups = new Map();
  
  console.log('🔍 BUILDING DEPTH-BASED HIERARCHY:');
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
        
        console.log(`📊 ${url} -> depth: ${depth}`);
      } catch (e) {
        nodeDepths.set(node.id, 0);
        console.log(`❌ Invalid URL: ${url}`);
      }
    }
  });
  
  const maxDepth = Math.max(...Array.from(nodeDepths.values()));
  console.log(`📊 Max depth: ${maxDepth}, Depth groups: ${depthGroups.size}`);
  
  // Position nodes by depth level
  let currentY = 100;
  
  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtDepth = depthGroups.get(depth) || [];
    if (nodesAtDepth.length === 0) continue;
    
    console.log(`📍 Positioning depth ${depth}: ${nodesAtDepth.length} nodes at Y=${currentY}`);
    
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
      console.log(`   ${node.data?.url}: (${x}, ${currentY})`);
    });
    
    // Move to next level
    currentY += nodeHeight + spacing + 80;
  }
  
  console.log(`🌳 ELK layout complete: ${positions.size} nodes positioned`);
  
  return positions;
}
