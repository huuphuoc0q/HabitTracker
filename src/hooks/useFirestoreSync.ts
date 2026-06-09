import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirestoreSync<T>(key: string, initialValue: T) {
  const { currentUser } = useAuth();
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setStoredValue(initialValue);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', currentUser.uid, 'data', key);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.value !== undefined) {
          setStoredValue(data.value as T);
        }
      } else {
        // Init if not exist
        setDoc(docRef, { value: initialValue }, { merge: true }).catch(err => {
          console.error("Error setting initial firestore value:", err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, key]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Optimistic update
      setStoredValue(valueToStore);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'data', key);
        await setDoc(docRef, { value: valueToStore }, { merge: true });
      }
    } catch (error) {
      console.error("Lỗi khi lưu vào Firestore:", error);
    }
  };

  return [storedValue, setValue, loading] as const;
}
