import type { CapacitorConfig } from '@capacitor/cli';

// AVISO: as pastas ios/ e android/ estão versionadas com os IDs reais usados nas lojas:
// - iOS bundle ID: com.soproneuro.app
// - Android package name: com.sopro.neuro
// O appId abaixo NÃO deve ser alterado para esses valores, pois o Capacitor o usa
// como esquema de deep link (app.sopro.neuro://...). Nunca rode `npx cap add ios/android`
// do zero; use apenas `npx cap sync` para evitar sobrescrever os IDs das lojas.
const config: CapacitorConfig = {
  appId: 'app.sopro.neuro',
  appName: 'Sopro Neuro',
  webDir: 'dist'
};

export default config;
