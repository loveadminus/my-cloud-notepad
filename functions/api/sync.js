async function verifyAuth(req, env) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) return null;
    
    const b64 = authHeader.substring(6);
    const decoded = atob(b64);
    const [username, password] = decoded.split(':');
    
    if (!username || !password) return null;
    
    const storedUser = await env.NOTE_KV.get(`user:${username}`, { type: "json" });
    if (storedUser && storedUser.password === password) return username;
    return null;
}

export async function onRequestGet(context) {
    try {
        const req = context.请求;
        const env = context.env;
        if (!req || !env || !env.NOTE_KV) throw new Error("环境异常，缺少 request 或 KV");

        const username = await verifyAuth(req, env);
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
        const req = context.请求;
        const env = context.env;
        if (!req || !env || !env.NOTE_KV) throw new Error("环境异常，缺少 request 或 KV");

        const username = await verifyAuth(req, env);
        if (!username) return new Response(JSON.stringify({ message: "未授权或登录失效" }), { status: 401 });

        // 同步这里也使用 text 绕过潜在 bug
        const data = await req.text();
        await env.NOTE_KV.put(`data:${username}`, data);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch(err) {
        return new Response(JSON.stringify({ message: err.message }), { status: 500 });
    }
}
