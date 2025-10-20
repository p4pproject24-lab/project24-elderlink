import { mockApi } from './apiMock';

describe('aiChatService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('askAiChat wraps string into {text}', async () => {
    const api = mockApi({ 'post /memory/ask?userId=u1': 'hello' });
    const svc = require('../aiChatService');
    const res = await svc.askAiChat('u1', { text: 'x' });
    expect(res.data).toEqual({ text: 'hello' });
  });
  
  it('askAiChat handles empty string by still wrapping', async () => {
    mockApi({ 'post /memory/ask?userId=u1': '' });
    const svc = require('../aiChatService');
    const res = await svc.askAiChat('u1', { text: '' });
    expect(res.data).toEqual({ text: '' });
  });

  it('avatar endpoints proxy data', async () => {
    const resp = { status: 200, data: { audioUrl: 'u' } };
    mockApi({ 'post /memory/ask-avatar?userId=u1': resp, 'post /memory/ask-game-avatar?userId=u1': resp, 'post /memory/ask-auto-avatar?userId=u1': resp });
    const svc = require('../aiChatService');
    const a = await svc.askAiChatAvatar('u1', { message: 'm' });
    const g = await svc.askGameAvatar('u1', { message: 'm', gameSessionId: 's', sessionId: 'sid' });
    const au = await svc.askAutoAvatar('u1', { sessionId: 'sid' });
    expect(a).toEqual(resp);
    expect(g).toEqual(resp);
    expect(au).toEqual(resp);
  });

  it('fetchChatHistory returns data', async () => {
    mockApi({ 'get /memory/chats?userId=u1&page=0': [{ id: 1 }] });
    const svc = require('../aiChatService');
    const res = await svc.fetchChatHistory('u1', 0);
    expect(res.length).toBe(1);
  });

  it('introduceUser wraps response', async () => {
    mockApi({ 'post /memory/introduce?userId=u1': 'ok' });
    const svc = require('../aiChatService');
    const res = await svc.introduceUser('u1', 'text');
    expect(res.status).toBe(200);
    expect(res.data).toBe('ok');
  });

  it('askAiChat passes object response through without wrapping', async () => {
    const api = mockApi({ 'post /memory/ask?userId=u1': { text: 'obj' } });
    const svc = require('../aiChatService');
    const res = await svc.askAiChat('u1', { text: 'x' });
    expect(res.data).toEqual({ text: 'obj' });
  });

  it('propagates backend errors for avatar endpoints', async () => {
    const api = mockApi();
    api.post.mockRejectedValueOnce(new Error('ask-avatar fail'));
    api.post.mockRejectedValueOnce(new Error('ask-game-avatar fail'));
    api.post.mockRejectedValueOnce(new Error('ask-auto-avatar fail'));
    const svc = require('../aiChatService');
    await expect(svc.askAiChatAvatar('u1', { message: 'm' })).rejects.toBeTruthy();
    await expect(svc.askGameAvatar('u1', { message: 'm', gameSessionId: 's', sessionId: 'sid' })).rejects.toBeTruthy();
    await expect(svc.askAutoAvatar('u1', { sessionId: 'sid' })).rejects.toBeTruthy();
  });

  it('fetchChatHistory uses provided page and handles API error', async () => {
    const api = mockApi();
    api.get.mockRejectedValueOnce(new Error('history fail'));
    const svc = require('../aiChatService');
    await expect(svc.fetchChatHistory('u1', 5)).rejects.toBeTruthy();
  });

  it('introduceUser propagates API error', async () => {
    const api = mockApi();
    const svc = require('../aiChatService');
    api.post.mockRejectedValueOnce(new Error('intro fail'));
    await expect(svc.introduceUser('u1', 'hi')).rejects.toBeTruthy();
  });
});


