import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildURLHierarchy, calculateTreeLayout, createHierarchyEdges } from '@/lib/url-hierarchy';

/**
 * Create Project API
 * POST /api/projects/create
 * Body: { name: string, domain: string, sitemapUrl: string, urls: Array }
 */
export async function POST(request: NextRequest) {
  try {
    const { name, domain, sitemapUrl, urls } = await request.json();

    if (!name || !domain || !sitemapUrl || !urls) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract unique sitemap sources
    const sitemapSources = [...new Set(urls.map((u: any) => u.sitemapSource).filter(Boolean))];
    
    // Create project document
    const projectRef = await addDoc(collection(db, 'projects'), {
      name,
      domain,
      sitemapUrl,
      urlCount: urls.length,
      sitemaps: sitemapSources, // Store list of all sitemap files
      ownerId: 'anonymous', // TODO: Replace with actual user ID from auth
      settings: {
        autoLayout: true,
        theme: 'dark',
        showMinimap: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const projectId = projectRef.id;

    // Limit total nodes to prevent performance issues
    const MAX_NODES = 500;
    const urlsToCreate = urls.slice(0, MAX_NODES);
    
    console.log(`📝 Creating hierarchical layout for ${urlsToCreate.length} nodes`);

    // Build URL hierarchy
    const hierarchy = buildURLHierarchy(urlsToCreate);
    const positions = calculateTreeLayout(hierarchy, {
      horizontalSpacing: 400,
      verticalSpacing: 180,
      startX: 100,
      startY: 100,
    });
    const edges = createHierarchyEdges(hierarchy);
    
    console.log(`🌲 Hierarchy built: ${hierarchy.size} nodes, ${edges.length} edges`);

    // Create nodes with hierarchical positions
    const BATCH_SIZE = 500;
    const nodeRefs: any[] = [];
    const urlToNodeId = new Map<string, string>(); // Track URL to Firestore ID mapping
    
    const hierarchyArray = Array.from(hierarchy.values());
    
    for (let i = 0; i < hierarchyArray.length; i += BATCH_SIZE) {
      const batchNodes = hierarchyArray.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      
      batchNodes.forEach((hierarchyNode) => {
        const nodeRef = doc(collection(db, `projects/${projectId}/nodes`));
        const position = positions.get(hierarchyNode.path) || { x: 0, y: 0 };
        
        // Find the original URL data to get sitemapSource
        const originalUrlData = urlsToCreate.find((u: any) => u.url === hierarchyNode.url);
        const sitemapSource = originalUrlData?.sitemapSource || 'sitemap.xml';
        
        nodeRefs.push({ id: nodeRef.id, url: hierarchyNode.url });
        urlToNodeId.set(hierarchyNode.url, nodeRef.id);

        // Find parent node ID
        let parentId: string | null = null;
        if (hierarchyNode.parentPath) {
          const parentNode = hierarchy.get(hierarchyNode.parentPath);
          if (parentNode) {
            parentId = parentNode.url; // We'll update this with Firestore ID in second pass
          }
        }

        batch.set(nodeRef, {
          url: hierarchyNode.url,
          thumbUrl: null,
          position,
          showIframe: false,
          title: hierarchyNode.title,
          description: null,
          parentId, // Will store parent URL for now
          depth: hierarchyNode.depth,
          path: hierarchyNode.path,
          sitemapSource, // Track which sitemap this URL came from
          metadata: {
            lastModified: null,
            status: 'pending',
            screenshotAt: null,
            updatedBy: 'system',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} committed (${batchNodes.length} nodes)`);
    }

    // Create edges between parent and child nodes using Firestore IDs
    if (edges.length > 0) {
      // Build a mapping of URLs to Firestore document IDs
      const urlToId = new Map<string, string>();
      nodeRefs.forEach(ref => {
        urlToId.set(ref.url, ref.id);
      });
      
      const edgeBatch = writeBatch(db);
      let edgesCreated = 0;
      
      edges.slice(0, 500).forEach((edge) => {
        const sourceId = urlToId.get(edge.source);
        const targetId = urlToId.get(edge.target);
        
        // Only create edge if both nodes exist
        if (sourceId && targetId) {
          const edgeRef = doc(collection(db, `projects/${projectId}/edges`));
          
          edgeBatch.set(edgeRef, {
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            animated: false,
            label: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          edgesCreated++;
        }
      });
      
      if (edgesCreated > 0) {
        await edgeBatch.commit();
        console.log(`✅ Created ${edgesCreated} edges`);
      }
    }

    console.log(`✅ Created project ${projectId} with ${nodeRefs.length} nodes`);

    return NextResponse.json({
      success: true,
      projectId,
      nodeCount: nodeRefs.length,
      message: `Project created with ${nodeRefs.length} pages`,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

