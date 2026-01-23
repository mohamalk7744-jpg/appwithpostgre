import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as Auth from '@/lib/auth';

export function useAuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[AuthRedirect] Checking authentication status...');
        const userInfo = await Auth.getUserInfo();
        const sessionToken = await Auth.getSessionToken();
        
        const authenticated = !!userInfo && !!sessionToken;
        console.log('[AuthRedirect] Authentication status:', {
          hasUserInfo: !!userInfo,
          hasSessionToken: !!sessionToken,
          isAuthenticated: authenticated,
        });
        
        setIsSignedIn(authenticated);
      } catch (error) {
        console.error('[AuthRedirect] Error checking auth:', error);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('[AuthRedirect] Navigation check:', {
      isSignedIn,
      inAuthGroup,
      inTabsGroup,
      segments,
    });

    if (isSignedIn && inAuthGroup) {
      // User is signed in but in auth group, redirect to tabs
      console.log('[AuthRedirect] Redirecting to tabs...');
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      // User is not signed in and not in auth group, redirect to login
      console.log('[AuthRedirect] Redirecting to login...');
      router.replace('/auth/login');
    }
  }, [isSignedIn, segments, isLoading, router]);

  return { isLoading, isSignedIn };
}
