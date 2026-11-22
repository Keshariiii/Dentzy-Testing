export const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
};

export const extractToken = (c, cookieName) => {
  const cookies = parseCookies(c.req.header('Cookie'));
  if (cookies[cookieName]) return cookies[cookieName];
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
};

export const cookieHeader = (name, value, maxAge, env) => {
  const isProd = env?.NODE_ENV === 'production';
  const sameSite = isProd ? 'SameSite=None' : 'SameSite=Lax';
  const secure = isProd ? '; Secure' : '';
  return `${name}=${value}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; ${sameSite}${secure}`;
};

export const clearCookieHeader = (name, env) => {
  const isProd = env?.NODE_ENV === 'production';
  const sameSite = isProd ? 'SameSite=None' : 'SameSite=Lax';
  const secure = isProd ? '; Secure' : '';
  return `${name}=; HttpOnly; Path=/; Max-Age=0; ${sameSite}${secure}`;
};
