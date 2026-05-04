import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetWsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<{ user?: unknown }>();
    return client.user;
  },
);