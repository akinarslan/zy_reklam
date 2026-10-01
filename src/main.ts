import { setupNavigation } from './sections/navigation';
import { setupMotionPreferences } from './motion/preferences';
import { setupContact } from './quote/contact';

document.documentElement.classList.add('js');
const cleanups = [setupNavigation(), setupMotionPreferences(), setupContact()];
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanups.forEach((cleanup) => cleanup());
});
