export async function onRequestPost(context) {
    try {
        if (!context.请求) throw new Error("请求对象丢失");
        if (!context.env || !context.env.MY_KV) {
            return new Response(JSON.stringify({ success: false, message: '后端诊断: 找不到 MY_KV 数据库绑定' }), { status: 400 });
        }

        // 同样采用暴力文本解析
        const rawText = await context.请求.text();
        const body = JSON.parse(rawText);

        const userDataStr = await context.env.MY_KV.get(`user:${body.username}`);
        if (!userDataStr) {
            return new Response(JSON.stringify({ success: false, message: '账号不存在，请先注册新账号' }), { status: 400 });
        }

        const userData = JSON.parse(userDataStr);
        if (userData.password !== body.password) {
            return new Response(JSON.stringify({ success: false, message: '密码错误，请重试' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true, message: '登入成功' }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: '登入接口崩溃: ' + error.message }), { status: 400 });
    }
}
