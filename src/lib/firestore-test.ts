// Simple Firestore connection test
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirestoreConnection() {
  try {
    // Try to access a collection (this will fail if rules are too restrictive)
    const testCollection = collection(db, 'test');

    // Try to read from the collection
    const snapshot = await getDocs(testCollection);

    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
}
