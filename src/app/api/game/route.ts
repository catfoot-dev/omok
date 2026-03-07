import { NextResponse } from 'next/server';

import { InvalidGameRequestError, processGameRequest } from '@/lib/game/service';

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await request.json();
    const response = processGameRequest(payload);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof InvalidGameRequestError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: '게임 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
