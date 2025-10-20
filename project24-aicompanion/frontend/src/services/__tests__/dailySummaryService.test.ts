import { mockApi } from './apiMock';

describe('dailySummaryService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('getAll, getByDate, generate, canGenerate, delete work', async () => {
    const tz = -new Date().getTimezoneOffset();
    mockApi({
      'get /daily-summaries/u1': [{ id: '1' }],
      'get /daily-summaries/u1/2025-01-01': { id: 'd' },
      'post /daily-summaries/u1/generate': { id: 'g' },
      [`get /daily-summaries/u1/can-generate/2025-01-01?timezoneOffsetMinutes=${tz}`]: { canGenerate: true, exists: false, date: 'x' },
      'delete /daily-summaries/u1/2025-01-01': {},
    });
    const { dailySummaryService } = require('../dailySummaryService');
    expect((await dailySummaryService.getAll('u1')).length).toBe(1);
    expect((await dailySummaryService.getByDate('u1', '2025-01-01')).id).toBe('d');
    expect((await dailySummaryService.generate('u1', '2025-01-01')).id).toBe('g');
    const can = await dailySummaryService.canGenerate('u1', '2025-01-01');
    expect(can.canGenerate).toBe(true);
    await dailySummaryService.delete('u1', '2025-01-01');
  });
});


