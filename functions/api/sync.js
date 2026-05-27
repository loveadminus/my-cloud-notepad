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
    try {
        const { 请求, env } = context;
        if (!env.MY_KV) return new Response(JSON.stringify({error: '后端诊断: KV未绑定'}), {status: 400});

        const auth = getAuth(请求);
        if (!auth) return new Response("Unauthorized", {status: 401});

        const userDataStr = await env.MY_KV.get(`user:${auth.username}`);
        if (!userDataStr) return new Response("Unauthorized", {status: 401});
        
        const userData = JSON.parse(userDataStr);
        if (userData.password !== auth.password) return new Response("Unauthorized", {status: 401});

        return new Response(JSON.stringify(userData.data || {}), {status: 200});
    } catch (error) {
        return new Response(JSON.stringify({error: error.message}), {status: 400});
    }
}

export async function onRequestPost(context) {
    try {
        const { 请求, env } = context;
        if (!env.MY_KV) return new Response(JSON.stringify({success: false, message: '后端诊断: KV未绑定'}), {status: 400});

        const auth = getAuth(请求);
        if (!auth) return new Response("Unauthorized", {status: 401});

        const userDataStr = await env.MY_KV.get(`user:${auth.username}`);
        if (!userDataStr) return new Response("Unauthorized", {status: 401});
        
        const userData = JSON.parse(userDataStr);
        if (userData.password !== auth.password) return new Response("Unauthorized", {status: 401});

        const newData = await 请求.json();
        userData.data = newData;
        await env.MY_KV.put(`user:${auth.username}`, JSON.stringify(userData));

        return new Response(JSON.stringify({success: true}), {status: 200});
    } catch (error) {
        return new Response(JSON.stringify({success: false, message: '保存异常: ' + error.message}), {status: 400});
    }
}
