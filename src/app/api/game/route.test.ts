import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/game/route';

describe('POST /api/game', () => {
  it('returns the AI opening move when the player starts as white', async () => {
    const request = new Request('http://localhost/api/game', {
      method: 'POST',
      body: JSON.stringify({
        action: 'start',
        playerColor: 1,
        board: [],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('processing');
    expect(payload.placedStones).toEqual([{ color: 0, index: 1, x: 7, y: 7 }]);
  });

  it('rejects malformed payloads', async () => {
    const request = new Request('http://localhost/api/game', {
      method: 'POST',
      body: JSON.stringify({
        action: 'move',
        playerColor: 0,
        board: [],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
