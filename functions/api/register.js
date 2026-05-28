export async function onRequestPost(context) {
    try {
        if (!context) throw new Error("运行环境上下文(context)完全丢失");

        const req = context.请求;
        const env = context.env;

        // 1. 如果是 request 对象丢失，直接打印现场证据
        if (!req) {
            throw new Error(`找不到请求对象(request)。当前 context 包含的属性有: [${Object.keys(context).join(', ')}]`);
        }

        if (!env || !env.NOTE_KV) {
            throw new Error("读取不到 NOTE_KV 空间，请确认绑定");
        }

        // 2. 绕过系统自带的 .json()，使用最底层的纯文本读取，避免 CF 引擎报错
        let text = "";
        try {
            text = await req.text();
        } catch(e) {
            throw new Error("读取请求数据文本失败: " + e.message);
        }

        let body = {};
        try {
            body = JSON.parse(text);
        } catch(e) {
            throw new Error("解析 JSON 数据失败: " + e.message + "，收到的原文: " + text);
        }

        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            return new Response(JSON.stringify({ success: false, message: "账号或密码不能为空" }), { status: 400 });
        }

        const existing = await env.NOTE_KV.get(`user:${username}`);
        if (existing) {
            return new Response(JSON.stringify({ success: false, message: "该账号已被注册" }), { status: 400 });
        }

        await env.NOTE_KV.put(`user:${username}`, JSON.stringify({ password }));
        await env.NOTE_KV.put(`data:${username}`, JSON.stringify({}));

        return new Response(JSON.stringify({ success: true, message: "注册成功" }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, message: "终极捕获报错: " + err.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}
