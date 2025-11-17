import './style.css';

// DO NOT USE IN PRODUCTION!
// EXAMPLE CODE FOR DEMONSTRATION PURPOSE ONLY.

const navDrilldown = document.getElementById('nav-drilldown');
const navButton = document.getElementById('nav-button');

navButton.addEventListener('click', () => {
  navDrilldown.open = true;
});

navDrilldown.addEventListener('dismiss', (e) => {
  e.target.open = false;
});

navDrilldown.addEventListener('update', (e) => {
  e.target.activeIdentifier = e.detail.activeIdentifier;
});
