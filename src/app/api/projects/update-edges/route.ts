import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log(`🔄 Updating edges for project: ${projectId}`);

    // Get all edges for the project
    const edgesRef = collection(db, `projects/${projectId}/edges`);
    const edgesQuery = query(edgesRef);
    const edgesSnapshot = await getDocs(edgesQuery);

    if (edgesSnapshot.empty) {
      return NextResponse.json({ message: 'No edges found to update' });
    }

    console.log(`📊 Found ${edgesSnapshot.docs.length} edges to update`);

    // Debug: Log all edge types
    console.log('🔍 Edge types found:');
    edgesSnapshot.docs.forEach((edgeDoc, index) => {
      const edgeData = edgeDoc.data();
      console.log(`  Edge ${index + 1}: type="${edgeData.type}", source="${edgeData.source}", target="${edgeData.target}"`);
    });

    // Update edges in batches
    const BATCH_SIZE = 500;
    let totalUpdated = 0;

    for (let i = 0; i < edgesSnapshot.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = edgesSnapshot.docs.slice(i, i + BATCH_SIZE);
      
      batchDocs.forEach((edgeDoc) => {
        const edgeData = edgeDoc.data();
        
        // Only update if the edge type is 'smoothstep'
        if (edgeData.type === 'smoothstep') {
          const edgeRef = doc(db, `projects/${projectId}/edges`, edgeDoc.id);
          batch.update(edgeRef, {
            type: 'default',
            updatedAt: serverTimestamp(),
          });
          totalUpdated++;
        }
      });

      if (totalUpdated > 0) {
        await batch.commit();
        console.log(`✅ Updated batch ${Math.floor(i / BATCH_SIZE) + 1} (${totalUpdated} edges)`);
      }
    }

    console.log(`✅ Successfully updated ${totalUpdated} edges to bezier (default) type`);
    
    return NextResponse.json({ 
      message: `Updated ${totalUpdated} edges to bezier type`,
      totalUpdated 
    });

  } catch (error: any) {
    console.error('❌ Error updating edges:', error);
    return NextResponse.json(
      { error: 'Failed to update edges', details: error.message },
      { status: 500 }
    );
  }
}
