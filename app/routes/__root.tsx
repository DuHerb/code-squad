import type { ReactNode } from 'react';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router';

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
