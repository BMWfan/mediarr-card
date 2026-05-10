// sections/sonarr2-section.js
import { SonarrBaseSection } from './sonarr-section.js?v=20260403-20';

export class Sonarr2Section extends SonarrBaseSection {
  constructor() {
    super('sonarr2', 'Sonarr2 Shows');
    this.titleKey = 'sonarr2_upcoming_shows';
  }
}
