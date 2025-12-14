export function ThemeScript() {
  // Default to dark unless user explicitly chose light.
  const code = `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  } catch {}
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}


