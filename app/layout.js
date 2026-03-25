import './globals.css';

export const metadata = {
  title: 'Dementia BioTracker — Early Detection via Wearable Biomarkers',
  description:
    'AI-powered dementia risk screening using Samsung Galaxy Watch biomarkers. ' +
    'No MRI required. K.L.N. College of Engineering — Department of AI & DS.',
  keywords: 'dementia, early detection, wearable, biomarkers, Samsung watch, MCI, AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </head>
      <body className="bg-mesh min-h-screen">{children}</body>
    </html>
  );
}
