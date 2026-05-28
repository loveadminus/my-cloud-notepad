function extractEnv(arg1, arg2) {
    if (arg1 && arg1.请求) return { req: arg1.请求, env: arg1.env };
    return { req: arg1, env: arg2 };
}

async function handleRequest(req, env) {
    try {
        if (!req) throw new Error("未能捕获到请求对象(Request)");
        if (!env || !env.NOTE_KV) throw new Error("尚未绑定 NOTE_KV");

        const body = await req.json();
        const username = body.username;
        const password = body.password;

        const storedUser = await env.NOTE_KV.get(`user:${username}`, { type: "json" });

        if (!storedUser || storedUser.password !== password) {
            return new Response(JSON.stringify({ success: false, message: "账号或密码错误" }), { status: 401 });
        }

        return new Response(JSON.stringify({ success: true, message: "登入成功" }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, message: "后端拦截异常: " + err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}

export async function onRequestPost(arg1, arg2) {
    const { req, env } = extractEnv(arg1, arg2);
    return await handleRequest(req, env);
}

export default {
    async fetch(请求, env, ctx) {
        return await handleRequest(请求, env);
    }
}
