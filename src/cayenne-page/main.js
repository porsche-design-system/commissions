import './style.scss';
import { breakpointS } from '@porsche-design-system/components-js/styles';

document.querySelector('p-canvas').addEventListener('sidebarStartUpdate', (e) => {
  e.target.sidebarStartOpen = e.detail.open;
});

document.querySelector('p-canvas').addEventListener('sidebarEndDismiss', (e) => {
  e.target.sidebarEndOpen = false;
});

for (const accordion of document.querySelectorAll('p-accordion')) {
  accordion.addEventListener('update', (e) => {
    e.target.open = e.detail.open;
  });
}

for (const tabsBar of document.querySelectorAll('p-tabs-bar')) {
  tabsBar.addEventListener('update', (e) => {
    e.target.activeTabIndex = e.detail.activeTabIndex;
  });
}

for (const flyout of document.querySelectorAll('p-flyout')) {
  flyout.addEventListener('dismiss', (e) => {
    e.target.open = false;
  });
}

document.getElementById('theme-switch').addEventListener('update', (e) => {
  e.target.checked = e.detail.checked;

  // update theme prop of all PDS components in Light DOM
  for (const el of Array.from(document.querySelectorAll('*')).filter((el) => el.tagName.startsWith('P-'))) {
    el.theme = e.detail.checked ? 'dark' : 'light';
  }
});

// initially, p-canvas sidebar-start should be closed on mobile and opened on desktop
if (window.matchMedia(`(min-width: ${breakpointS}px)`).matches) {
  document.querySelector('p-canvas').sidebarStartOpen = true;
}
