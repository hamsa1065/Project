import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FLASK_API = process.env.FLASK_API_URL || 'https://project-d2wr.onrender.com';

export async function GET() {
  try {
    const res = await fetch(`${FLASK_API}/health`, { cache: 'no-store' });
    const data = await res.json();

    return NextResponse.json({
      status:   data.status === 'ok' ? 'ready' : 'error',
      python:   { found: data.python },
      model:    data.model,
      script:   true,
      packages: {
        sklearn: data.sklearn,
        pandas:  data.pandas,
        numpy:   data.numpy,
      },
    });
  } catch {
    return NextResponse.json({
      status:   'error',
      python:   { found: false },
      model:    false,
      script:   false,
      packages: { sklearn: false, pandas: false, numpy: false },
    });
  }
}


// import { NextResponse } from 'next/server';

// export const dynamic = 'force-dynamic';

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

// export async function GET() {
//   try {
//     if (!BACKEND_URL) {
//       return NextResponse.json({
//         status: 'error',
//         error: 'BACKEND_URL not set in environment variables',
//         python: false, model: false, sklearn: false, pandas: false, numpy: false,
//       });
//     }

//     const response = await fetch(`${BACKEND_URL}/health`, {
//       signal: AbortSignal.timeout(10000),
//     });
//     const data = await response.json();
//     return NextResponse.json(data);

//   } catch {
//     return NextResponse.json({
//       status: 'error',
//       error: 'Cannot reach backend. It may be starting up — wait 30s and refresh.',
//       python: false, model: false, sklearn: false, pandas: false, numpy: false,
//     });
//   }
// }
