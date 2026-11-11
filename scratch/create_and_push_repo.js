const { execSync } = require('child_process');
const https = require('https');

function getGitHubToken() {
  try {
    const output = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8'
    });
    const match = output.match(/password=(.+)/);
    return match ? match[1].trim() : null;
  } catch (e) {
    console.error('Failed to get credential:', e.message);
    return null;
  }
}

function githubRequest(token, method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'NodeJS-App',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const token = getGitHubToken();
  if (!token) {
    console.error('No GitHub token found in credentials.');
    return;
  }
  console.log('GitHub token found! Checking user...');
  const userRes = await githubRequest(token, 'GET', '/user');
  console.log('Authenticated as:', userRes.data.login);

  const repoName = 'catalogo-l1ma-motors';
  console.log(`Checking if repo ${repoName} exists...`);
  const checkRes = await githubRequest(token, 'GET', `/repos/${userRes.data.login}/${repoName}`);
  
  if (checkRes.status === 404) {
    console.log(`Creating repository ${repoName}...`);
    const createRes = await githubRequest(token, 'POST', '/user/repos', {
      name: repoName,
      description: 'Catálogo digital em tempo real L1MA Motors & Concessionária Shineray',
      private: false
    });
    if (createRes.status === 201) {
      console.log('Repository created successfully:', createRes.data.html_url);
    } else {
      console.error('Failed to create repository:', createRes.status, createRes.data);
      return;
    }
  } else if (checkRes.status === 200) {
    console.log('Repository already exists:', checkRes.data.html_url);
  } else {
    console.error('Error checking repository:', checkRes.status, checkRes.data);
    return;
  }

  // Setup git remote
  try {
    try {
      execSync('git remote remove origin');
    } catch {}
    const remoteUrl = `https://github.com/${userRes.data.login}/${repoName}.git`;
    console.log(`Setting remote origin: ${remoteUrl}`);
    execSync(`git remote add origin ${remoteUrl}`);
    
    console.log('Pushing to GitHub...');
    execSync('git push -u origin main', { stdio: 'inherit' });
    console.log('PUSH COMPLETED SUCCESSFULLY!');
  } catch (e) {
    console.error('Git push failed:', e.message);
  }
}

main();
