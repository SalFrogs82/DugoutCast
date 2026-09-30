/**
 * Robust API helper with safe JSON parsing and graceful fallbacks.
 * Prevents "The string did not match the expected pattern" errors in Safari and WebKit
 * when servers return non-JSON, empty, or HTML error pages.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  isFallback?: boolean;
}

export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackData?: T
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    const rawText = await res.text();
    if (!rawText || rawText.trim() === '') {
      return {
        success: !!fallbackData,
        data: fallbackData || null,
        error: 'Empty server response',
        isFallback: true,
      };
    }

    try {
      const parsed = JSON.parse(rawText);
      if (res.ok && parsed.success !== false) {
        return {
          success: true,
          data: parsed as T,
        };
      }
      return {
        success: !!fallbackData,
        data: fallbackData || (parsed as T),
        error: parsed?.error || `HTTP ${res.status}`,
        isFallback: !res.ok,
      };
    } catch {
      // Non-JSON response (e.g. HTML 502/504 from proxy)
      return {
        success: !!fallbackData,
        data: fallbackData || null,
        error: 'Non-JSON server response',
        isFallback: true,
      };
    }
  } catch (err: any) {
    return {
      success: !!fallbackData,
      data: fallbackData || null,
      error: err?.message || 'Network request failed',
      isFallback: true,
    };
  }
}
