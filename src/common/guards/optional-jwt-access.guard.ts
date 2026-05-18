import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAccessGuard extends AuthGuard('jwt-access') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    return user as TUser;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}