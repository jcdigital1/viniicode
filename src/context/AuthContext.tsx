import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  registerUser: (name: string, email: string, pass: string) => Promise<void>;
  loginUser: (email: string, pass: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const mapAuthErrorToFriendlyMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'O provedor de E-mail/Senha não está ativado no Firebase Authentication. Ative o método E-mail/Senha no Firebase Console (Authentication > Sign-in method).';
    case 'auth/unauthorized-domain':
      return 'Este domínio não está na lista de domínios autorizados no Firebase Authentication. Adicione o domínio no Firebase Console (Authentication > Settings > Authorized domains).';
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui uma conta.';
    case 'auth/invalid-email':
      return 'Digite um e-mail válido.';
    case 'auth/weak-password':
      return 'Crie uma senha mais segura (no mínimo 6 caracteres).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    case 'auth/requires-recent-login':
      return 'Para esta ação de segurança, faça login novamente.';
    default:
      if (error?.message && typeof error.message === 'string') {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return 'Falha de conexão. Tente novamente.';
        }
        if (error.message.includes('OPERATION_NOT_ALLOWED')) {
          return 'O provedor de E-mail/Senha não está ativado no Firebase Console (Authentication > Sign-in method).';
        }
      }
      return 'Não foi possível realizar esta operação. Verifique sua conexão ou tente novamente.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitor real Firebase Auth session state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Document might still be creating or registered elsewhere
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Usuário',
              email: user.email || '',
              createdAt: new Date().toISOString(),
            };
            setUserProfile(fallbackProfile);
            await setDoc(userDocRef, fallbackProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUserProfile({
            uid: user.uid,
            name: user.displayName || 'Usuário',
            email: user.email || '',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerUser = async (name: string, email: string, pass: string) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Create user in Firebase Authentication
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = credential.user;

    // 2. Update display name in Firebase Auth
    if (cleanName) {
      await updateProfile(user, { displayName: cleanName });
    }

    // 3. Create document in Cloud Firestore users/{uid}
    const profile: UserProfile = {
      uid: user.uid,
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
  };

  const loginUser = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    await signInWithEmailAndPassword(auth, cleanEmail, pass);
  };

  const logoutUser = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  const resetUserPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  const updateDisplayName = async (newName: string) => {
    const cleanName = newName.trim();
    if (!currentUser) return;
    await updateProfile(currentUser, { displayName: cleanName });
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, { name: cleanName }, { merge: true });
    setUserProfile((prev) => (prev ? { ...prev, name: cleanName } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        registerUser,
        loginUser,
        logoutUser,
        resetUserPassword,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
