import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get all edges for the project
    const edgesRef = collection(db, `projects/${projectId}/edges`);
    const edgesQuery = query(edgesRef);
    const edgesSnapshot = await getDocs(edgesQuery);

    if (edgesSnapshot.empty) {
      return NextResponse.json({ message: 'No edges found to update' });
    }

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
      }
    }

    return NextResponse.json({
      message: `Updated ${totalUpdated} edges to bezier type`,
      totalUpdated
    });

  } catch (error: any) {
    console.error('Error updating edges:', error);
    return NextResponse.json(
      { error: 'Failed to update edges', details: error.message },
      { status: 500 }
    );
  }
}
