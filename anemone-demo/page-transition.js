// Anemone: 静かなカーテン風ページトランジション（共有ヘルパー）
export const RD_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
export const RD_MS_OUT = 720;
export const RD_MS_IN = 820;
const FLAG = 'rd-page-transitioning';

export function rdWasTransitioningIn() {
  try { return sessionStorage.getItem(FLAG) === '1'; } catch (e) { return false; }
}
export function rdClearFlag() {
  try { sessionStorage.removeItem(FLAG); } catch (e) {}
}
export function rdSetFlag() {
  try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
}
export function rdPrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isModifiedClick(e) {
  return e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

function isEligible(a) {
  if (!a || !a.getAttribute) return false;
  const href = a.getAttribute('href');
  if (!href) return false;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download')) return false;
  let url;
  try { url = new URL(href, window.location.href); } catch (e) { return false; }
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === window.location.pathname) return false; // 同一ページ内アンカー
  return true;
}

// クリックを捕捉し、対象なら onEligibleClick(navigateFn) を呼ぶ。戻り値はデタッチ関数。
export function rdAttachLinkInterceptor(onEligibleClick) {
  let navigating = false;
  const handler = (e) => {
    if (isModifiedClick(e)) return;
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!isEligible(a)) return;
    if (navigating) { e.preventDefault(); e.stopPropagation(); return; }
    e.preventDefault();
    navigating = true;
    const targetHref = new URL(a.getAttribute('href'), window.location.href).href;
    onEligibleClick(() => {
      rdSetFlag();
      window.location.href = targetHref;
    });
  };
  // 戻る／進む・bfcache復帰後は遷移ロックを解除しておく
  const unlock = () => { navigating = false; };
  document.addEventListener('click', handler, true);
  window.addEventListener('pageshow', unlock);
  return () => {
    document.removeEventListener('click', handler, true);
    window.removeEventListener('pageshow', unlock);
  };
}
