function extractEnv(arg1, arg2) {
    if (arg1 && arg1.请求) return { req: arg1.请求, env: arg1.env };
    return { req: arg1, env: arg2 };
}

async function verifyAuth(req, env) {
    const authHeader = req.headers.get('Authorization');
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

async function handleGet(req, env) {
    try {
        const username = await verifyAuth(req, env);
        if (!username) return new Response(JSON.stringify({ message: "未授权或登录失效" }), { status: 401 });

        let data = await env.NOTE_KV.get(`data:${username}`);
        if (!data) data = "{}";

        return new Response(data, { status: 200, headers: { "Content-Type": "application/json" } });
    } catch(err) {
        return new Response(JSON.stringify({ message: err.message }), { status: 500 });
    }
}

async function handlePost(req, env) {
    try {
        const username = await verifyAuth(req, env);
        if (!username) return new Response(JSON.stringify({ message: "未授权或登录失效" }), { status: 401 });

        const data = await req.text();
        await env.NOTE_KV.put(`data:${username}`, data);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch(err) {
        return new Response(JSON.stringify({ message: err.message }), { status: 500 });
    }
}

export async function onRequestGet(arg1, arg2) {
    const { req, env } = extractEnv(arg1, arg2);
    return await handleGet(req, env);
}

export async function onRequestPost(arg1, arg2) {
    const { req, env } = extractEnv(arg1, arg2);
    return await handlePost(req, env);
}

export default {
    async fetch(请求, env, ctx) {
        if (请求.method === "GET") return await handleGet(请求, env);
        if (请求.method === "POST") return await handlePost(请求, env);
        return new Response("Method not allowed", { status: 405 });
    }
}
