import './style.css';

document.querySelector('select[name="theme"]').addEventListener('change', (e) => {
  document.documentElement.classList.remove('light', 'dark', 'auto');
  document.documentElement.classList.add(e.target.value);
});

document.querySelector('input[name="accent"]').addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--my-accent', e.target.value);
});
