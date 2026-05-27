// 解析 Authorization Header 取出账号密码
function getAuth(请求) {
    const authHeader = 请求.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) return null;
    try {
        const decoded = atob(authHeader.split(' ')[1]);
        const [username, password] = decoded.split(':');
        return { username, password };
    } catch(e) { return null; }
}

export async function onRequestGet(context) {
    const { 请求, env } = context;
    const auth = getAuth(请求);
    if (!auth) return new Response("Unauthorized", {status: 401});

    const userDataStr = await env.MY_KV.get(`user:${auth.username}`);
    if (!userDataStr) return new Response("Unauthorized", {status: 401});
    
    const userData = JSON.parse(userDataStr);
    if (userData.password !== auth.password) return new Response("Unauthorized", {status: 401});

    // 返回用户的笔记数据
    return new Response(JSON.stringify(userData.data || {}));
}

export async function onRequestPost(context) {
    const { 请求, env } = context;
    const auth = getAuth(请求);
    if (!auth) return new Response("Unauthorized", {status: 401});

    const userDataStr = await env.MY_KV.get(`user:${auth.username}`);
    if (!userDataStr) return new Response("Unauthorized", {status: 401});
    
    const userData = JSON.parse(userDataStr);
    if (userData.password !== auth.password) return new Response("Unauthorized", {status: 401});

    // 提取前端发来的最新数据并覆盖
    const newData = await 请求.json();
    userData.data = newData;
    
    // 保存回 KV 数据库
    await env.MY_KV.put(`user:${auth.username}`, JSON.stringify(userData));

    return new Response(JSON.stringify({success: true}));
}
