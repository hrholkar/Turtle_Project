import { API_BASE_URL } from '../constants/theme';

let requestQueue = Promise.resolve();

async function customFetch<T = any>(
  method: string,
  url: string,
  data?: any,
  config?: any
): Promise<{ data: T }> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Handle query params
  let finalUrl = fullUrl;
  if (config?.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== undefined) searchParams.append(key, String(value));
    }
    finalUrl += `?${searchParams.toString()}`;
  }

  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = {
    ...(config?.headers || {}),
  };

  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  } else {
    delete headers['Content-Type'];
  }

  // Serialize requests to prevent Android concurrent socket exhaustion
  return new Promise<{ data: T }>((resolve, reject) => {
    requestQueue = requestQueue.then(async () => {
      console.log(`[Fetch Request] ${method} ${finalUrl}`);
      try {
        const response = await fetch(finalUrl, {
          method,
          headers,
          body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
        });

        console.log(`[Fetch Response] ${method} ${finalUrl} - ${response.status}`);

        const responseData = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            responseData?.error ||
            responseData?.message ||
            `HTTP Error ${response.status}`;
          console.error(`[Fetch Error] ${method} ${finalUrl}:`, message);
          reject(new Error(message));
          return;
        }

        resolve({ data: responseData });
      } catch (error: any) {
        console.error(`[Fetch Error] ${method} ${finalUrl}:`, error.message);
        reject(new Error(error.message || 'Network error'));
      }
    }).catch(() => { }); // catch to prevent queue from stopping
  });
}

export const api = {
  get: <T = any>(url: string, config?: any) => customFetch<T>('GET', url, undefined, config),
  post: <T = any>(url: string, data?: any, config?: any) => customFetch<T>('POST', url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => customFetch<T>('PUT', url, data, config),
  delete: <T = any>(url: string, config?: any) => customFetch<T>('DELETE', url, undefined, config),
};
