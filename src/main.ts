import { setupNavigation } from './sections/navigation';
import { setupMotionPreferences } from './motion/preferences';
import { setupContact } from './quote/contact';
import { setupHeroScene } from './scene/hero';
import { setupBrandShowcase } from './scene/brand-showcase';

document.documentElement.classList.add('js');
const cleanups = [setupNavigation(), setupMotionPreferences(), setupContact(), setupHeroScene(), setupBrandShowcase()];
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanups.forEach((cleanup) => cleanup());
});
