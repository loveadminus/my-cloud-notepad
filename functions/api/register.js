export async function onRequestPost(context) {
    try {
        if (!context.请求) throw new Error("请求对象丢失");
        if (!context.env || !context.env.MY_KV) {
            return new Response(JSON.stringify({ success: false, message: '后端诊断: 找不到 MY_KV 数据库绑定' }), { status: 400 });
        }

        // 暴力破解：放弃自带的 .json()，强制读取纯文本后转换
        const rawText = await context.请求.text();
        const body = JSON.parse(rawText);
        
        if (!body.username || !body.password) {
            return new Response(JSON.stringify({ success: false, message: '账号或密码不能为空' }), { status: 400 });
        }

        // 检查重复注册
        const existingUser = await context.env.MY_KV.get(`user:${body.username}`);
        if (existingUser) {
            return new Response(JSON.stringify({ success: false, message: '该账号已被注册，请直接登入' }), { status: 400 });
        }

        // 注册写入
        const initialData = { password: body.password, data: {} };
        await context.env.MY_KV.put(`user:${body.username}`, JSON.stringify(initialData));

        return new Response(JSON.stringify({ success: true, message: '注册成功' }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: '注册接口崩溃: ' + error.message }), { status: 400 });
    }
}
