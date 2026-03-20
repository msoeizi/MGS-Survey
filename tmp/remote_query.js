fetch('https://survey.moderngrains.com/api/admin/system/diagnostics', {
    headers: { 'Authorization': 'Bearer antigravity-debug-token' }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
