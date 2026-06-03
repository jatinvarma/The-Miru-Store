const API = 'http://localhost:3001/api';

export default function useApi(token) {
  const headers = (extra = {}) => ({ 
    'Content-Type': 'application/json', 
    ...(token ? { Authorization: `Bearer ${token}` } : {}), 
    ...extra 
  });
  
  const get = p => fetch(API + p, { headers: headers() }).then(r => r.json()).catch(() => ({}));
  const post = (p, b) => fetch(API + p, { method: 'POST', headers: headers(), body: JSON.stringify(b) }).then(r => r.json()).catch(() => ({}));
  const put = (p, b) => fetch(API + p, { method: 'PUT', headers: headers(), body: JSON.stringify(b) }).then(r => r.json()).catch(() => ({}));
  const del = p => fetch(API + p, { method: 'DELETE', headers: headers() }).then(r => r.json()).catch(() => ({}));
  
  // For file uploads (no 'Content-Type' header, browser handles boundary)
  const postMultipart = (p, formData) => fetch(API + p, { 
    method: 'POST', 
    headers: token ? { Authorization: `Bearer ${token}` } : {}, 
    body: formData 
  }).then(r => r.json()).catch(() => ({}));

  return { get, post, put, del, postMultipart };
}
export { API };
