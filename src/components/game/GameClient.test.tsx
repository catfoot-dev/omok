import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GameClient } from '@/components/game/GameClient';

describe('GameClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses controlled radio inputs and starts an offline match', async () => {
    const user = userEvent.setup();
    render(<GameClient />);

    await user.click(screen.getByLabelText('로컬 2인'));
    await user.click(screen.getByRole('button', { name: '시작하기' }));

    expect(screen.getByLabelText('로컬 2인')).toBeDisabled();
    expect(screen.getByText('흑돌 차례')).toBeInTheDocument();
  });

  it('requests the AI opening move when the player starts as white', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'processing',
        placedStones: [{ color: 0, index: 1, x: 7, y: 7 }],
        highlightKeys: [],
        illegalPositions: [],
        scores: {},
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<GameClient />);

    await user.click(screen.getByLabelText('백돌'));
    await user.click(screen.getByRole('button', { name: '시작하기' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('백돌(플레이어) 차례')).toBeInTheDocument();
  });
});
