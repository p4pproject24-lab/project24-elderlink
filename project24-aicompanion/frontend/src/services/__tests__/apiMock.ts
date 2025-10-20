export function mockApi(returnMap: Record<string, any> = {}) {
  const calls: any[] = [];
  const makeResponse = (key: string, data: any) => ({ data });
  const apiInstance = {
    defaults: { baseURL: 'http://x' },
    get: jest.fn(async (url: string, config?: any) => {
      calls.push(['get', url, config]);
      const key = `get ${url}`;
      return makeResponse(key, returnMap[key] ?? returnMap[url] ?? {});
    }),
    post: jest.fn(async (url: string, body?: any, config?: any) => {
      calls.push(['post', url, body, config]);
      const key = `post ${url}`;
      return makeResponse(key, returnMap[key] ?? returnMap[url] ?? {});
    }),
    put: jest.fn(async (url: string, body?: any) => {
      calls.push(['put', url, body]);
      const key = `put ${url}`;
      return makeResponse(key, returnMap[key] ?? returnMap[url] ?? {});
    }),
    delete: jest.fn(async (url: string) => {
      calls.push(['delete', url]);
      const key = `delete ${url}`;
      return makeResponse(key, returnMap[key] ?? returnMap[url] ?? {});
    }),
    __calls: calls,
  } as any;
  jest.doMock('../../lib/api', () => ({ __esModule: true, default: async () => apiInstance }));
  return apiInstance;
}

// Dummy test to satisfy Jest when this helper is executed alone by the runner
describe('apiMock helper', () => { it('loads', () => expect(typeof mockApi).toBe('function')); });


