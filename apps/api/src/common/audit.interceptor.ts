import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (body) => {
        try {
          const user = req.user as { userId?: string } | undefined;
          const path = req.route?.path || req.url;
          await this.prisma.client.auditLog.create({
            data: {
              actorId: user?.userId,
              action: `${method} ${path}`,
              entity: 'http_request',
              entityId: String(path),
              metadata: { body: req.body, responseId: (body as { id?: string })?.id },
            },
          });
        } catch {
          /* audit must not break requests */
        }
      }),
    );
  }
}
