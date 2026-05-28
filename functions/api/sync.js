async function verifyAuth(请求, env) {
    const authHeader = 请求.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) return null;
    
    const b64 = authHeader.substring(6);
    const decoded = atob(b64);
    const [username, password] = decoded.split(':');
    
    if (!username || !password) return null;
    
    const storedUser = await env.NOTE_KV.get(`user:${username}`, { type: "json" });
    if (storedUser && storedUser.password === password) {
        return username;
    }
    return null;
}

export async function onRequestGet(context) {
    try {
        const 请求 = context.请求;
        const env = context.env;
        
        if (!env || !env.NOTE_KV) throw new Error("后端未能读取到 NOTE_KV 存储空间");

        const username = await verifyAuth(请求, env);
        if (!username) return new Response(JSON.stringify({ message: "未授权或登录失效" }), { status: 401 });

        let data = await env.NOTE_KV.get(`data:${username}`);
        if (!data) data = "{}";

        return new Response(data, { status: 200, headers: { "Content-Type": "application/json" } });
    } catch(err) {
        return new Response(JSON.stringify({ message: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    try {
        const 请求 = context.请求;
        const env = context.env;
        
        if (!env || !env.NOTE_KV) throw new Error("后端未能读取到 NOTE_KV 存储空间");

        const username = await verifyAuth(请求, env);
        if (!username) return new Response(JSON.stringify({ message: "未授权或登录失效" }), { status: 401 });

        const data = await 请求.text();
        await env.NOTE_KV.put(`data:${username}`, data);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch(err) {
        return new Response(JSON.stringify({ message: err.message }), { status: 500 });
    }
}
