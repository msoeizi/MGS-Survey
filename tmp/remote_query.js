fetch('https://survey.moderngrains.com/api/admin/system/diagnostics?bust=' + Math.random(), {
    headers: { 'Authorization': 'Bearer antigravity-debug-token', 'Cache-Control': 'no-cache' }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
