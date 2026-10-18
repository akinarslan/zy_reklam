import './main';
import { setupShowroom } from './showroom/controller';

const cleanup = setupShowroom();
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanup();
});
