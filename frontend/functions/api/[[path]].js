export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = `https://dentzy-backend.kesharinaman76.workers.dev${url.pathname}${url.search}`;
  
  // Forward the exact request to the backend worker
  // Context.request contains headers, cookies, method, and body
  return fetch(new Request(targetUrl, context.request));
}
