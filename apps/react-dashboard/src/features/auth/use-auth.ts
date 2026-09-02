import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { setAccessToken } from '../../lib/token-store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setAuthLoading,
  setAuthenticated,
  setUnauthenticated,
} from '../../store/auth-slice';

interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string };
}

export const useAuthStatus = () => useAppSelector((s) => s.auth.status);
export const useCurrentUser = () => useAppSelector((s) => s.auth.user);

// Runs once at app boot: exchanges the httpOnly refresh cookie for a fresh
// access token so a page reload doesn't force a re-login.
export function useInitAuth() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    dispatch(setAuthLoading());

    apiClient
      .post<AuthResponse>('/auth/refresh', {}, { _skipAuthRefresh: true })
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.data.accessToken);
        dispatch(setAuthenticated(res.data.user));
      })
      .catch(() => {
        if (cancelled) return;
        setAccessToken(null);
        dispatch(setUnauthenticated());
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onForcedLogout = () => {
      setAccessToken(null);
      dispatch(setUnauthenticated());
    };
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, [dispatch]);
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useCallback(
    async (email: string, password: string) => {
      const res = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      setAccessToken(res.data.accessToken);
      dispatch(setAuthenticated(res.data.user));
      navigate('/orders');
    },
    [dispatch, navigate],
  );
}

export function useRegister() {
  const login = useLogin();
  return useCallback(
    async (_fullName: string, email: string, password: string) => {
      // Backend has no "full name" field yet — captured client-side only for now.
      await apiClient.post('/auth/register', { email, password });
      await login(email, password);
    },
    [login],
  );
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
      dispatch(setUnauthenticated());
      navigate('/login');
    }
  }, [dispatch, navigate]);
}
