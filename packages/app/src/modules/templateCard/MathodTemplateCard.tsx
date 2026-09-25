import type { CSSProperties } from 'react';
import { useTheme } from '@material-ui/core/styles';
import { Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  entityRouteParams,
  entityRouteRef,
  useStarredEntity,
} from '@backstage/plugin-catalog-react';
import type { TemplateCardComponentProps } from '@backstage/plugin-scaffolder-react/alpha';
import { LOGOS } from './logos';

// Template card of the Create page, see docs/backstage/personnalisation/custom/template-cards.md

const AUTHOR_ANNOTATION = 'mathod.fr/author';
const ICON_ANNOTATION = 'mathod.fr/icon';

const FONT =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const TOKENS = {
  dark: {
    card: '#111418',
    border: '#262b31',
    title: '#ffffff',
    muted: '#8b949e',
    text: '#b4bcc6',
    chipBorder: '#2f363e',
    chipText: '#c9d1d9',
    accent: '#10b981',
    onAccent: '#06281d',
  },
  light: {
    card: '#ffffff',
    border: '#e2e4e8',
    title: '#1f2328',
    muted: '#5b6475',
    text: '#4a515c',
    chipBorder: '#d3d7dd',
    chipText: '#1f2328',
    accent: '#047857',
    onAccent: '#ffffff',
  },
};

// "group:default/admins" -> "admins"
const refName = (ref?: string) => ref?.split(/[:/]/).pop();

const Icon = ({ d, filled }: { d: string[]; filled?: boolean }) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d.map(path => (
      <path key={path} d={path} />
    ))}
  </svg>
);

const DOC = [
  'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
  'M14 3v5h5',
];
const STAR = [
  'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
];
const ARROW = ['M5 12h14', 'm13 6 6 6-6 6'];
const DETAILS = [
  'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2',
  'M7 10h6',
  'M7 14h10',
];
const GROUP = [
  'M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5',
  'M17 14.5c3 0 5 1.5 5 4.5',
  'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
  'M20 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0',
];

export const MathodTemplateCard = ({
  template,
  additionalLinks,
  onSelected,
}: TemplateCardComponentProps) => {
  const theme = useTheme();
  const t = TOKENS[theme.palette.type === 'dark' ? 'dark' : 'light'];
  const { toggleStarredEntity, isStarredEntity } = useStarredEntity(template);
  // Same link as the details icon of the standard card: the template page in the catalog
  const catalogEntityRoute = useRouteRef(entityRouteRef);

  const { metadata, spec } = template;
  const tags = metadata.tags ?? [];
  const logoKey =
    metadata.annotations?.[ICON_ANNOTATION] ?? tags.find(tag => LOGOS[tag]);
  const logo = logoKey ? LOGOS[logoKey] : undefined;
  const owner = refName(spec.owner);
  const author = refName(metadata.annotations?.[AUTHOR_ANNOTATION]);
  // The Create page passes the TechDocs link of the template here
  const docsUrl = additionalLinks?.[0]?.url;

  const button: CSSProperties = {
    height: 38,
    border: 'none',
    borderRadius: 8,
    background: t.accent,
    color: t.onAccent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 700,
  };
  const iconButton: CSSProperties = {
    ...button,
    width: 38,
    flexShrink: 0,
    padding: 0,
  };

  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            boxSizing: 'border-box',
            border: `2px solid ${t.accent}`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logo && (
            <svg
              width={30}
              height={30}
              viewBox={logo.viewBox}
              fill={t.accent}
              role="img"
              aria-label={logoKey}
            >
              {logo.paths.map(path => (
                <path key={path} d={path} />
              ))}
            </svg>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.25,
              color: t.title,
            }}
          >
            {metadata.title ?? metadata.name}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: t.muted }}>
            {spec.type}
          </span>
        </div>
      </div>

      {metadata.description && (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: t.text }}>
          {metadata.description}
        </p>
      )}

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '3px 10px',
                border: `1px solid ${t.chipBorder}`,
                borderRadius: 6,
                fontFamily: FONT,
                fontSize: 12,
                color: t.chipText,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {owner && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: FONT,
            fontSize: 12,
            color: t.muted,
          }}
        >
          <Icon d={GROUP} />
          {author ? `${owner}:${author}` : owner}
        </span>
      )}

      <div style={{ flexGrow: 1 }} />

      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          to={catalogEntityRoute(entityRouteParams(template))}
          aria-label="Template page"
          style={iconButton}
        >
          <Icon d={DETAILS} />
        </Link>
        {docsUrl && (
          <Link to={docsUrl} aria-label="Docs" style={iconButton}>
            <Icon d={DOC} />
          </Link>
        )}
        <button
          type="button"
          aria-label={
            isStarredEntity ? 'Remove from favorites' : 'Add to favorites'
          }
          aria-pressed={isStarredEntity}
          onClick={toggleStarredEntity}
          style={iconButton}
        >
          <Icon d={STAR} filled={isStarredEntity} />
        </button>
        <button
          type="button"
          onClick={() => onSelected?.()}
          style={{ ...button, flexGrow: 1, gap: 6, padding: '0 12px' }}
        >
          <Icon d={ARROW} />
          Choose
        </button>
      </div>
    </div>
  );
};
