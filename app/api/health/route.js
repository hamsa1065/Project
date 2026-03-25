import { NextResponse } from 'next/server';
import { existsSync }   from 'fs';
import { join }         from 'path';
import { exec }         from 'child_process';
import { promisify }    from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

async function findPython() {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      const { stdout, stderr } = await execAsync(`${cmd} --version`, { timeout: 5000 });
      const out = stdout + stderr;
      if (out.toLowerCase().includes('python')) return { cmd, version: out.trim() };
    } catch { /* try next */ }
  }
  return null;
}

async function checkPackages(python) {
  const packages = ['sklearn', 'pandas', 'numpy'];
  const results  = {};
  for (const pkg of packages) {
    try {
      await execAsync(`"${python}" -c "import ${pkg}"`, { timeout: 8000 });
      results[pkg] = true;
    } catch {
      results[pkg] = false;
    }
  }
  return results;
}

export async function GET() {
  const pythonDir  = join(process.cwd(), 'python');
  const scriptPath = join(pythonDir, 'dementia_predict.py');
  const modelPath  = join(pythonDir, 'dementia_model.pkl');

  const pythonInfo = await findPython();
  const packages   = pythonInfo ? await checkPackages(pythonInfo.cmd) : {};

  return NextResponse.json({
    status      : pythonInfo && existsSync(modelPath) && existsSync(scriptPath) ? 'ready' : 'error',
    python      : pythonInfo ? { found: true, cmd: pythonInfo.cmd, version: pythonInfo.version } : { found: false },
    model       : existsSync(modelPath),
    script      : existsSync(scriptPath),
    packages,
    platform    : process.platform,
    cwd         : process.cwd(),
  });
}
