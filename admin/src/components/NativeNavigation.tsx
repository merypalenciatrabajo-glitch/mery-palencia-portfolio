import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  canRestoreRoute,
  dismissActiveFormControl,
  parseNativeRoute,
  resolveNativeBackAction,
} from '@/lib/nativeNavigation';

const LAST_ROUTE_KEY = 'mery-admin:last-route';

export default function NativeNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathRef = useRef(location.pathname);
  const restoredRef = useRef(false);

  useEffect(() => {
    pathRef.current = location.pathname;
    if (location.pathname === '/' && !restoredRef.current) return;
    if (location.pathname !== '/login') {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (restoredRef.current || location.pathname !== '/') return;
    restoredRef.current = true;
    const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
    if (canRestoreRoute(savedRoute)) navigate(savedRoute, { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    const removers: Array<() => Promise<void>> = [];

    const register = async () => {
      const deepLink = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        const route = parseNativeRoute(url);
        if (route) navigate(route);
      });
      const backButton = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        const activeElement = document.activeElement;
        if (
          dismissActiveFormControl(
            activeElement instanceof HTMLElement ? activeElement : null,
          )
        ) {
          return;
        }

        const currentPath = pathRef.current;
        const action = resolveNativeBackAction(currentPath, canGoBack);
        if (action === 'history') {
          navigate(-1);
        } else if (action === 'dashboard') {
          navigate('/', { replace: true });
        } else {
          void CapacitorApp.exitApp();
        }
      });

      if (disposed) {
        await Promise.all([deepLink.remove(), backButton.remove()]);
      } else {
        removers.push(() => deepLink.remove(), () => backButton.remove());
      }
    };

    void register();
    return () => {
      disposed = true;
      void Promise.all(removers.map((remove) => remove()));
    };
  }, [navigate]);

  return null;
}
