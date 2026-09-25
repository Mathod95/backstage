import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SwappableComponentBlueprint } from '@backstage/plugin-app-react';
import { TemplateCard } from '@backstage/plugin-scaffolder-react/alpha';

// Replaces the template cards of the Create page.
// See docs/backstage/personnalisation/custom/template-cards.md
const templateCard = SwappableComponentBlueprint.make({
  name: 'template-card',
  params: define =>
    define({
      component: TemplateCard,
      loader: () =>
        import('./MathodTemplateCard').then(m => m.MathodTemplateCard),
    }),
});

export const templateCardModule = createFrontendModule({
  pluginId: 'app',
  extensions: [templateCard],
});
