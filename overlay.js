(() => {
  const key = '__verityCustomSidebarV2';
  if (globalThis[key]?.host.isConnected) {
    globalThis[key].toggle();
    return;
  }
  const host = document.createElement('div');
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0 0 0 auto!important;width:min(430px,100vw)!important;height:100dvh!important;z-index:2147483647!important;display:block!important;pointer-events:none!important;';
  const shadow = host.attachShadow({mode: 'closed'});
  const style = document.createElement('style');
  style.textContent = ':host{color-scheme:light dark}section{height:100%;width:100%;background:light-dark(#fff,#212121);box-shadow:-4px 0 22px #0002;transform:translateX(105%);transition:transform 160ms ease-out;visibility:hidden;pointer-events:none}section.open{transform:translateX(0);visibility:visible;pointer-events:auto}iframe{display:block;width:100%;height:100%;border:0;background:transparent}@media(prefers-reduced-motion:reduce){section{transition:none}}';
  const panel = document.createElement('section');
  panel.setAttribute('role', 'complementary');
  panel.setAttribute('aria-label', 'Verity AI sidebar');
  const frame = document.createElement('iframe');
  frame.title = 'Verity AI sidebar';
  // Keep the same iframe alive when hidden; no website reload on toggle.
  frame.src = chrome.runtime.getURL('sidepanel.html') + '?parent=' + encodeURIComponent(location.origin);
  panel.append(frame);
  shadow.append(style, panel);
  document.documentElement.append(host);
  let opened = false;
  let previousFocus;
  function setOpen(value) {
    opened = value;
    panel.classList.toggle('open', value);
    panel.inert = !value;
    panel.setAttribute('aria-hidden', String(!value));
    if (value) {
      previousFocus = document.activeElement;
      frame.focus();
    } else if (previousFocus?.isConnected) previousFocus.focus();
  }
  globalThis[key] = {host, toggle: () => setOpen(!opened)};
  const extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
  window.addEventListener('message', event => {
    if (event.source === frame.contentWindow && event.origin === extensionOrigin && event.data?.type === 'verity:close-sidebar') setOpen(false);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
})();
