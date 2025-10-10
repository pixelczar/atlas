/**
 * URL Hierarchy Parser
 * Analyzes sitemap URLs to create a hierarchical tree structure
 */

export interface URLNode {
  id: string;
  url: string;
  path: string;
  depth: number;
  parentPath: string | null;
  children: string[];
  title: string;
}

/**
 * Parse a URL to extract its path segments
 */
export function parseURL(url: string): { domain: string; path: string; segments: string[] } {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/\/$/, '') || '/'; // Remove trailing slash
    const segments = path === '/' ? [] : path.split('/').filter(Boolean);
    
    return {
      domain: urlObj.hostname,
      path,
      segments,
    };
  } catch {
    return {
      domain: '',
      path: '/',
      segments: [],
    };
  }
}

/**
 * Build a hierarchy tree from a list of URLs
 */
export function buildURLHierarchy(urls: Array<{ url: string; title?: string }>): Map<string, URLNode> {
  const nodeMap = new Map<string, URLNode>();
  
  // First pass: Create all nodes
  urls.forEach(({ url, title }) => {
    const { path, segments } = parseURL(url);
    
    const node: URLNode = {
      id: url,
      url,
      path,
      depth: segments.length,
      parentPath: null,
      children: [],
      title: title || segments[segments.length - 1] || 'Home',
    };
    
    nodeMap.set(path, node);
  });
  
  // Second pass: Build parent-child relationships
  nodeMap.forEach((node) => {
    if (node.depth > 0) {
      // Find parent by removing last segment
      const { segments } = parseURL(node.url);
      const parentSegments = segments.slice(0, -1);
      const parentPath = parentSegments.length === 0 ? '/' : '/' + parentSegments.join('/');
      
      let parentNode = nodeMap.get(parentPath);
      
      if (parentNode) {
        node.parentPath = parentPath;
        parentNode.children.push(node.path);
      } else {
        // Parent doesn't exist in sitemap, find closest existing parent
        console.log(`🔍 No exact parent found for ${node.url}, looking for closest parent...`);
        
        let bestParent = null;
        let bestMatchLength = 0;
        
        // Find all existing nodes and check if any is a prefix of current path
        for (const [existingPath, existingNode] of nodeMap.entries()) {
          if (existingNode === node) continue;
          
          // Check if this existing path is a prefix of the current path
          if (node.path.startsWith(existingPath) && existingPath !== node.path) {
            const matchLength = existingPath.split('/').filter(Boolean).length;
            if (matchLength > bestMatchLength) {
              bestParent = existingNode;
              bestMatchLength = matchLength;
              console.log(`🎯 Found better parent: ${existingPath} (match length: ${matchLength})`);
            }
          }
        }
        
        if (bestParent) {
          node.parentPath = bestParent.path;
          bestParent.children.push(node.path);
          console.log(`✅ Using closest parent: ${bestParent.path} for ${node.url}`);
        } else {
          // No suitable parent found, attach to root
          const rootNode = nodeMap.get('/');
          if (rootNode && node.path !== '/') {
            node.parentPath = '/';
            rootNode.children.push(node.path);
            console.log(`🔗 Connecting ${node.url} to root (no suitable parent found)`);
          }
        }
      }
    }
  });
  
  return nodeMap;
}

/**
 * Calculate layout positions - DEPTH-BASED COLUMNS
 * Creates clear vertical columns based on URL depth
 * Much clearer than a tree for understanding site structure!
 */
export interface LayoutPosition {
  x: number;
  y: number;
}

export function calculateTreeLayout(
  hierarchy: Map<string, URLNode>,
  options: {
    horizontalSpacing?: number;
    verticalSpacing?: number;
    startX?: number;
    startY?: number;
  } = {}
): Map<string, LayoutPosition> {
  const {
    horizontalSpacing = 450, // Space between depth columns
    verticalSpacing = 200,   // Space between cards in same column
    startX = 100,
    startY = 100,
  } = options;
  
  const positions = new Map<string, LayoutPosition>();
  
  // Group nodes by depth
  const depthGroups = new Map<number, URLNode[]>();
  hierarchy.forEach((node) => {
    const group = depthGroups.get(node.depth) || [];
    group.push(node);
    depthGroups.set(node.depth, group);
  });
  
  // Sort each depth group alphabetically for consistency
  depthGroups.forEach((nodes, depth) => {
    nodes.sort((a, b) => a.path.localeCompare(b.path));
  });
  
  // Position nodes in columns by depth
  depthGroups.forEach((nodes, depth) => {
    const x = startX + (depth * horizontalSpacing);
    
    nodes.forEach((node, index) => {
      const y = startY + (index * verticalSpacing);
      positions.set(node.path, { x, y });
    });
  });
  
  return positions;
}

/**
 * Create edges between parent and child nodes
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
}

export function createHierarchyEdges(hierarchy: Map<string, URLNode>): Edge[] {
  const edges: Edge[] = [];
  
  hierarchy.forEach((node) => {
    node.children.forEach((childPath) => {
      const childNode = hierarchy.get(childPath);
      if (childNode) {
        edges.push({
          id: `${node.url}->${childNode.url}`,
          source: node.url,
          target: childNode.url,
        });
      }
    });
  });
  
  return edges;
}

