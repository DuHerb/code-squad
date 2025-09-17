import type { ReactNode } from 'react';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router';

// Import the global CSS file
import '../styles/app.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Code Squad',
      },
    ],
  }),
  component: RootComponent,
});

/**
 * Renders the root application layout: a document wrapper that includes a top navigation bar and an Outlet for nested routes.
 *
 * The navigation contains links to "/" ("Challenge") and "/progress" ("Progress Dashboard"); the active link is styled bold.
 *
 * @returns The React element tree for the root route.
 */
function RootComponent() {
  return (
    <RootDocument>
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #eee',
          marginBottom: '20px',
          display: 'flex',
          gap: '15px',
        }}
      >
        <Link to='/' activeProps={{ style: { fontWeight: 'bold' } }}>
          Challenge
        </Link>
        <Link to='/progress' activeProps={{ style: { fontWeight: 'bold' } }}>
          Progress Dashboard
        </Link>
      </div>
      <Outlet />
    </RootDocument>
  );
}

/**
 * Renders the full HTML document shell for route pages.
 *
 * The component outputs a complete <html> element containing a <head> (populated via HeadContent)
 * and a <body> that wraps the provided children and the router Scripts.
 *
 * @param children - The content to be rendered inside the document body.
 * @returns The root HTML element for the page.
 */
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
