import { setupShowcase } from './showcase/controller';
import { setupNavigation } from './sections/navigation';
import { setupMotionPreferences } from './motion/preferences';
import { setupContact } from './quote/contact';
import { setupHeroScene } from './scene/hero';
import { setupLiveContent } from './content/live/checker';
import { setupMatrix } from './matrix/setup';

document.documentElement.classList.add('js');
const cleanups = [setupNavigation(), setupMotionPreferences(), setupContact(), setupHeroScene(), setupShowcase(), setupMatrix()];
if (import.meta.env.PROD) cleanups.push(setupLiveContent());
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanups.forEach((cleanup) => cleanup());
});
