import { setupNavigation } from './sections/navigation';
import { setupMotionPreferences } from './motion/preferences';
import { setupContact } from './quote/contact';
import { setupShowroom } from './showroom/controller';
import { setupHeroScene } from './scene/hero';

document.documentElement.classList.add('js');
const cleanups = [setupNavigation(), setupMotionPreferences(), setupContact(), setupHeroScene(), setupShowroom()];
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanups.forEach((cleanup) => cleanup());
});
