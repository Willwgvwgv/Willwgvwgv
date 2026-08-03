import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;
  
  // Ensure profile exists in agenda_profiles
  const profileRef = doc(db, 'agenda_profiles', user.uid);
  const profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) {
    await setDoc(profileRef, {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      role: 'admin', // default to admin for full access
      active: true,
      createdAt: new Date().toISOString()
    });
  }
  return user;
}

export async function signUpWithEmail(email: string, password: string, name?: string, role: string = 'comercial') {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const profileRef = doc(db, 'agenda_profiles', user.uid);
  await setDoc(profileRef, {
    uid: user.uid,
    name: name || email.split('@')[0],
    email: email,
    role: role,
    active: true,
    createdAt: new Date().toISOString()
  });

  return user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthStateChangedListener(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid: string) {
  try {
    const profileRef = doc(db, 'agenda_profiles', uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      return profileSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
