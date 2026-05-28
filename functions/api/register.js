export async function onRequestPost(context) {
    try {
        // 放弃解构，直接稳妥地获取对象
        const req = context.请求;
        const env = context.env;

        // 精准拦截：如果 request 丢失
        if (!req) {
            throw new Error("未能获取请求(request)对象，请确保这是在 Pages 环境中运行");
        }
        
        // 精准拦截：如果 KV 没绑定好
        if (!env || !env.NOTE_KV) {
            throw new Error("KV存储空间 'NOTE_KV' 未绑定，请前往 CF 后台设置");
        }

        const body = await req.json();
        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            return new Response(JSON.stringify({ success: false, message: "账号或密码不能为空" }), { status: 400 });
        }

        // 检查用户是否已存在
        const existing = await env.NOTE_KV.get(`user:${username}`);
        if (existing) {
            return new Response(JSON.stringify({ success: false, message: "该账号已被注册" }), { status: 400 });
        }

        // 保存用户信息和初始化空数据
        await env.NOTE_KV.put(`user:${username}`, JSON.stringify({ password }));
        await env.NOTE_KV.put(`data:${username}`, JSON.stringify({}));

        return new Response(JSON.stringify({ success: true, message: "注册成功" }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (err) {
        // 把错误直接返回给前端面板
        return new Response(JSON.stringify({ success: false, message: "后台详细错误: " + err.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
