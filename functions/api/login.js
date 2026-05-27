export async function onRequestPost(arg1, arg2) {
    try {
        const 请求 = arg1.请求 || arg1;
        const env = arg1.env || arg2;

        if (!env || !env.MY_KV) {
            return new Response(JSON.stringify({ success: false, message: '找不到 MY_KV 数据库绑定' }), { status: 400 });
        }

        const rawText = await 请求.text();
        const body = JSON.parse(rawText);

        const userDataStr = await env.MY_KV.get(`user:${body.username}`);
        if (!userDataStr) {
            return new Response(JSON.stringify({ success: false, message: '账号不存在，请先注册新账号' }), { status: 400 });
        }

        const userData = JSON.parse(userDataStr);
        if (userData.password !== body.password) {
            return new Response(JSON.stringify({ success: false, message: '密码错误，请重试' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true, message: '登入成功' }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: '后端致命错误: ' + error.message }), { status: 400 });
    }
}
