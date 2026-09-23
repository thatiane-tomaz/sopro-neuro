import { useEffect } from 'react';

/**
 * Mantém a tela acesa enquanto o conteúdo está tocando, para o celular
 * não bloquear e interromper vídeo/hipnose (comportamento de "filme").
 *
 * Usa o plugin nativo do Capacitor quando disponível e, no navegador,
 * a Screen Wake Lock API.
 */
export const useKeepAwake = (active: boolean) => {
  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let sentinel: any = null;
    let nativeHeld = false;

    const acquireWebLock = async () => {
      try {
        const anyNav = navigator as any;
        if (!anyNav.wakeLock?.request) return;
        sentinel = await anyNav.wakeLock.request('screen');
        if (cancelled) {
          sentinel?.release?.();
          sentinel = null;
        }
      } catch {
        // Wake lock não suportado ou negado — ignora
      }
    };

    const acquire = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { KeepAwake } = await import('@capacitor-community/keep-awake');
          await KeepAwake.keepAwake();
          nativeHeld = true;
          return;
        }
      } catch {
        // Plugin indisponível — cai para a API do navegador
      }
      await acquireWebLock();
    };

    // Se o usuário sair e voltar para o app, reobtém o bloqueio do navegador
    const handleVisibility = () => {
      if (!document.hidden && !nativeHeld && !sentinel) acquireWebLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    acquire();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      try {
        sentinel?.release?.();
      } catch {}
      sentinel = null;
      if (nativeHeld) {
        import('@capacitor-community/keep-awake')
          .then(({ KeepAwake }) => KeepAwake.allowSleep())
          .catch(() => {});
      }
    };
  }, [active]);
};

export default useKeepAwake;
