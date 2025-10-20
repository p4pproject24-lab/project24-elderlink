import { mockApi } from './apiMock';

describe('reminderService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('CRUD and pagination paths', async () => {
    mockApi({
      'post /reminders': { id: 'r1', userId: 'u1', title: 't', timestamp: 'now', description: 'd', tags: [], status: 'INCOMPLETE' },
      // two responses to cover hasMore true then false
      'get /reminders?userId=u1&page=0': { reminders: new Array(10).fill(0).map((_,i)=>({ id: 'r'+i, userId: 'u1', title: 't', timestamp: 'now', description: 'd', tags: [], status: 'INCOMPLETE' })) },
      'put /reminders/r1': { id: 'r1', userId: 'u1', title: 't2', timestamp: 'now', description: 'd', tags: [], status: 'COMPLETE' },
      'delete /reminders/r1': {},
    });
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    svc.setUserId('u1');
    const created = await svc.createReminder({ userId: 'u1', title: 't', timestamp: 'now', tags: [] });
    expect(created.id).toBe('r1');
    const list = await svc.getReminders(0);
    expect(list.hasMore).toBe(true);
    const updated = await svc.updateReminder('r1', { title: 't2' });
    expect(updated.title).toBe('t2');
    await svc.deleteReminder('r1');
    await svc.markAsCompleted('r1');
    await svc.markAsMissed('r1');
    await svc.markAsIncomplete('r1');
  });

  it('handles userId not set and error branches', async () => {
    const api = mockApi();
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    await expect(svc.createReminder({ userId: 'u1', title: 't', timestamp: 'now', tags: [] })).rejects.toBeTruthy();
    await expect(svc.getReminders(0)).rejects.toThrow('User ID not set');

    // update/delete error branches
    api.put.mockRejectedValueOnce(new Error('update fail'));
    await expect(svc.updateReminder('id', {})).rejects.toBeTruthy();
    api.delete.mockRejectedValueOnce(new Error('delete fail'));
    await expect(svc.deleteReminder('id')).rejects.toBeTruthy();
  });

  it('getReminders handles API error and returns empty page', async () => {
    const api = mockApi();
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    svc.setUserId('u1');
    api.get.mockRejectedValueOnce(new Error('fetch fail'));
    const res = await svc.getReminders(3);
    expect(res.reminders).toEqual([]);
    expect(res.currentPage).toBe(3);
    expect(res.hasMore).toBe(false);
  });

  it('getReminders handles array response and sets hasMore=false when <10', async () => {
    const api = mockApi({ 'get /reminders?userId=u1&page=2': [{ id: 'a1', userId: 'u1', title: 't', timestamp: 'now', description: 'd', tags: [], status: 'INCOMPLETE' }] });
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    svc.setUserId('u1');
    const res = await svc.getReminders(2);
    expect(res.reminders.length).toBe(1);
    expect(res.hasMore).toBe(false);
    expect(res.currentPage).toBe(2);
  });

  it('getReminders handles array response and sets hasMore=true when ===10', async () => {
    const ten = new Array(10).fill(0).map((_, i) => ({ id: 'x'+i, userId: 'u1', title: 't', timestamp: 'now', description: 'd', tags: [], status: 'INCOMPLETE' }));
    const api = mockApi({ 'get /reminders?userId=u1&page=5': ten });
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    svc.setUserId('u1');
    const res = await svc.getReminders(5);
    expect(res.reminders.length).toBe(10);
    expect(res.hasMore).toBe(true);
  });

  it('getReminders handles object response with empty reminders', async () => {
    const api = mockApi({ 'get /reminders?userId=u1&page=6': { reminders: [] } });
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    svc.setUserId('u1');
    const res = await svc.getReminders(6);
    expect(res.reminders.length).toBe(0);
    expect(res.hasMore).toBe(false);
  });

  it('createReminder propagates API error after userId set', async () => {
    const api = mockApi();
    const svcMod = require('../reminderService');
    const svc = svcMod.reminderService;
    svc.setUserId('u1');
    api.post.mockRejectedValueOnce(new Error('create fail'));
    await expect(svc.createReminder({ userId: 'u1', title: 't', timestamp: 'now', tags: [] })).rejects.toBeTruthy();
  });
});


