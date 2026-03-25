import { NextResponse } from 'next/server';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

export async function POST(request) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({
        error: 'Backend URL not configured.\n\nAdd BACKEND_URL environment variable in Vercel dashboard pointing to your Render URL.\nExample: https://dementia-biotracker-api.onrender.com',
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('zipFile');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No ZIP file received.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Please upload a .zip file exported from Samsung Health.' },
        { status: 400 }
      );
    }

    const backendForm = new FormData();
    backendForm.append('zipFile', file);

    const response = await fetch(`${BACKEND_URL}/diagnose`, {
      method: 'POST',
      body: backendForm,
      signal: AbortSignal.timeout(55000),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend error' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timed out. Backend is waking up (first request ~30s on free tier). Please try again in 30 seconds.' },
        { status: 504 }
      );
    }
    console.error('Diagnose API error:', err);
    return NextResponse.json(
      { error: err.message || 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
