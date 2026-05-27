export async function onRequestPost(context) {
    try {
        const { 请求, env } = context;
        
        if (!env.MY_KV) {
            return new Response(JSON.stringify({ success: false, message: '后端诊断: 找不到 MY_KV 数据库绑定' }), { status: 400 });
        }

        const body = await 请求.json();
        const { username, password } = body;

        const userDataStr = await env.MY_KV.get(`user:${username}`);
        if (!userDataStr) {
            return new Response(JSON.stringify({ success: false, message: '账号不存在，请先注册新账号' }), { status: 400 });
        }

        const userData = JSON.parse(userDataStr);
        if (userData.password !== password) {
            return new Response(JSON.stringify({ success: false, message: '密码错误，请重试' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true, message: '登入成功' }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: '代码崩溃详请: ' + error.message }), { status: 400 });
    }
}
