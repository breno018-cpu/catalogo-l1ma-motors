const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5173' + path, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  console.log('=== TEST 1: ?m=shineray-worker-125 ===');
  const res1 = await get('/?m=shineray-worker-125');
  const ogTags1 = res1.data.match(/<meta (property="og:[^"]+"|name="twitter:[^"]+") content="[^"]*"/g);
  console.log(ogTags1?.join('\n'));

  console.log('\n=== TEST 2: /m/shineray-jet-125 ===');
  const res2 = await get('/m/shineray-jet-125');
  const ogTags2 = res2.data.match(/<meta (property="og:[^"]+"|name="twitter:[^"]+") content="[^"]*"/g);
  console.log(ogTags2?.join('\n'));

  console.log('\n=== TEST 3: Home / ===');
  const res3 = await get('/');
  const ogTags3 = res3.data.match(/<meta (property="og:[^"]+"|name="twitter:[^"]+") content="[^"]*"/g);
  console.log(ogTags3?.join('\n'));
}

test().catch(console.error);
