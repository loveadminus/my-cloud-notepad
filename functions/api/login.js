export async function onRequestPost(context) {
    const { 请求, env } = context;
    const { username, password } = await 请求.json();

    const userDataStr = await env.MY_KV.get(`user:${username}`);
    if (!userDataStr) {
        return new Response(JSON.stringify({success: false, message: '账号不存在'}), {status: 401});
    }

    const userData = JSON.parse(userDataStr);
    if (userData.password !== password) {
        return new Response(JSON.stringify({success: false, message: '密码错误'}), {status: 401});
    }

    return new Response(JSON.stringify({success: true}));
}
