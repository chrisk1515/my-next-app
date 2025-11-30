import './globals.css';

export const metadata = {
  title: 'Solar System 3D',
  description:
    'Interactive solar system classroom simulator with Hawaiian wayfinding overlays.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
