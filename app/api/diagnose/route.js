import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir, access } from 'fs/promises';
import { existsSync }  from 'fs';
import { join }        from 'path';
import { tmpdir }      from 'os';          // ← Works on Windows AND Linux/Mac
import { exec }        from 'child_process';
import { promisify }   from 'util';

const execAsync = promisify(exec);

// App Router: these are the correct exports (NOT `export const config`)
export const dynamic    = 'force-dynamic';
export const maxDuration = 120;   // seconds — give Python time to run

// ─── helper: find Python executable ───────────────────────────────────────────
async function findPython() {
  // Try each candidate in order; return the first one that works
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(`${cmd} --version`, { timeout: 5000 });
      if (stdout.includes('Python') || stdout.includes('python')) return cmd;
    } catch {
      // try next
    }
    // on Windows stderr also carries the version string
    try {
      await execAsync(`${cmd} -c "import sys; print(sys.version)"`, { timeout: 5000 });
      return cmd;
    } catch {
      // try next
    }
  }
  return null;
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  let tmpPath = null;

  try {
    // 1. Parse multipart form ──────────────────────────────────────────────────
    const formData = await request.formData();
    const file     = formData.get('zipFile');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No ZIP file received.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Please upload a .zip file exported from Samsung Health.' },
        { status: 400 }
      );
    }

    // 2. Save to temp folder (cross-platform: os.tmpdir()) ─────────────────────
    const uploadDir = join(tmpdir(), 'dementia_uploads');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    tmpPath = join(uploadDir, `upload_${Date.now()}.zip`);
    const bytes = await file.arrayBuffer();
    await writeFile(tmpPath, Buffer.from(bytes));

    // 3. Locate Python script & model ──────────────────────────────────────────
    const pythonDir  = join(process.cwd(), 'python');
    const scriptPath = join(pythonDir, 'dementia_predict.py');
    const modelPath  = join(pythonDir, 'dementia_model.pkl');

    if (!existsSync(scriptPath)) {
      return NextResponse.json({
        error: `Model script not found at: ${scriptPath}\nMake sure dementia_predict.py is inside the "python" folder.`,
      }, { status: 500 });
    }
    if (!existsSync(modelPath)) {
      return NextResponse.json({
        error: `Model file not found at: ${modelPath}\nMake sure dementia_model.pkl is inside the "python" folder.`,
      }, { status: 500 });
    }

    // 4. Find Python ───────────────────────────────────────────────────────────
    const python = await findPython();
    if (!python) {
      return NextResponse.json({
        error: 'Python is not installed or not in PATH.\n\nPlease install Python 3 from https://python.org and make sure to check "Add Python to PATH" during installation.\n\nThen run: pip install scikit-learn pandas numpy',
      }, { status: 500 });
    }

    // 5. Run Python prediction ─────────────────────────────────────────────────
    // Quote paths to handle spaces in Windows paths like "C:\Users\Hamsavidhya\..."
    const cmd = `"${python}" "${scriptPath}" "${tmpPath}" --json`;

    let stdout = '', stderr = '';
    try {
      ({ stdout, stderr } = await execAsync(cmd, {
        cwd: pythonDir,
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,   // 10MB output buffer
      }));
    } catch (execErr) {
      console.error('Python exec error:', execErr.message);
      console.error('stderr:', execErr.stderr);

      // Check for common Python package errors
      if (execErr.stderr?.includes('ModuleNotFoundError') || execErr.stderr?.includes('No module named')) {
        const missingPkg = execErr.stderr.match(/No module named '([^']+)'/)?.[1] || 'a required package';
        return NextResponse.json({
          error: `Python package missing: "${missingPkg}"\n\nRun this command and try again:\n\npip install scikit-learn pandas numpy`,
        }, { status: 500 });
      }

      return NextResponse.json({
        error: `Python script failed:\n${execErr.stderr || execErr.message}`,
      }, { status: 500 });
    }

    // 6. Extract JSON from output ──────────────────────────────────────────────
    const jsonLine = stdout.split('\n').find(l => l.startsWith('JSON_OUTPUT:'));

    if (!jsonLine) {
      console.error('No JSON_OUTPUT found.');
      console.error('stdout:', stdout.slice(0, 1000));
      console.error('stderr:', stderr.slice(0, 1000));
      return NextResponse.json({
        error: `Model ran but returned no output.\n\nDebug info:\n${stdout.slice(0, 500)}\n${stderr.slice(0, 500)}`,
      }, { status: 500 });
    }

    const prediction = JSON.parse(jsonLine.replace('JSON_OUTPUT:', '').trim());
    return NextResponse.json(prediction, { status: 200 });

  } catch (err) {
    console.error('Diagnose API error:', err);
    return NextResponse.json(
      { error: err.message || 'Unexpected server error.' },
      { status: 500 }
    );

  } finally {
    // 7. Clean up temp file ────────────────────────────────────────────────────
    if (tmpPath && existsSync(tmpPath)) {
      await unlink(tmpPath).catch(() => {});
    }
  }
}

