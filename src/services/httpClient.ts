// Shared fetch-based HTTP primitive. Mimics the pieces of axios's request/
// response/error shape (response.data, error.response.status/data) that the
// rest of the app already depends on, so callers didn't need to change when
// api.ts and authService.ts moved off axios.

export interface HttpConfig {
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface HttpResponse<T = any> {
    data: T;
    status: number;
    headers: Headers;
}

export class HttpError extends Error {
    response?: { status: number; data: any; headers?: Headers };
    code?: string;

    constructor(message: string, opts: { response?: HttpError['response']; code?: string } = {}) {
        super(message);
        this.name = 'HttpError';
        this.response = opts.response;
        this.code = opts.code;
    }
}

export function isFormDataBody(data: any): boolean {
    return !!data && (
        data instanceof FormData ||
        (typeof data === 'object' && (data.constructor?.name === 'FormData' || '_parts' in data))
    );
}

function buildUrl(baseURL: string, url: string, params?: Record<string, any>): string {
    const full = `${baseURL}${url}`;
    if (!params) return full;
    const query = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
    return query ? `${full}?${query}` : full;
}

export async function fetchJson<T = any>(
    baseURL: string,
    method: string,
    url: string,
    data: any,
    config: HttpConfig,
    defaultTimeout: number
): Promise<HttpResponse<T>> {
    const fullUrl = buildUrl(baseURL, url, config.params);
    const headers: Record<string, string> = { Accept: 'application/json', ...config.headers };

    let body: BodyInit | undefined;
    const dataIsFormData = isFormDataBody(data);
    if (data !== undefined) {
        if (dataIsFormData) {
            // Let fetch set the multipart boundary itself.
            delete headers['Content-Type'];
            delete headers['content-type'];
            body = data;
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(data);
        }
    }

    const controller = new AbortController();
    const timeoutMs = config.timeout ?? defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch(fullUrl, { method, headers, body, signal: controller.signal });
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new HttpError('The server is still waking up. Please wait and try again.', { code: 'ECONNABORTED' });
        }
        throw new HttpError(
            `Network error at ${method} ${url}. Please check your connection and ensure the backend is reachable.`,
            { code: 'ERR_NETWORK' }
        );
    } finally {
        clearTimeout(timeoutId);
    }

    const text = await response.text();
    let parsed: any = null;
    if (text) {
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = text;
        }
    }

    if (!response.ok) {
        throw new HttpError(parsed?.message || `Request failed with status ${response.status}`, {
            response: { status: response.status, data: parsed, headers: response.headers },
        });
    }

    return { data: parsed as T, status: response.status, headers: response.headers };
}
