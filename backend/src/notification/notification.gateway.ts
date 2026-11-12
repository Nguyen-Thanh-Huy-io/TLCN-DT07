import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: false,
  },
})
export class NotificationGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-user-room')
  async handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: string },
  ) {
    if (!payload?.userId) {
      return;
    }
    await client.join(`user:${payload.userId}`);
  }

  @SubscribeMessage('leave-user-room')
  async handleLeaveUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: string },
  ) {
    if (!payload?.userId) {
      return;
    }
    await client.leave(`user:${payload.userId}`);
  }

  emitNewNotification(userId: string, notification: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification:new', notification);
    }
  }
}
