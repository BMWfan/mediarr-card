// sections/radarr2-section.js
import { RadarrBaseSection } from './radarr-section.js?v=20260403-20';

export class Radarr2Section extends RadarrBaseSection {
  constructor() {
    super('radarr2', 'Radarr2 Movies');
    this.titleKey = 'radarr2_upcoming_movies';
  }
}
