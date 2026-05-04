import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WsJwtAccessGuard extends AuthGuard('jwt-access') {
  getRequest(context: ExecutionContext) {
    if (context.getType<'http' | 'ws'>() === 'ws') {
      const client = context.switchToWs().getClient();
      return client?.handshake;
    }

    return context.switchToHttp().getRequest();
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (context.getType<'http' | 'ws'>() === 'ws') {
      const client = context.switchToWs().getClient();
      if (client) {
        client.user = user;
      }
    }

    return user as TUser;
  }
}