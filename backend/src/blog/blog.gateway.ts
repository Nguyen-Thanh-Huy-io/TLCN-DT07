import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: false,
  },
})
export class BlogGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-post-room')
  joinPostRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { postId?: string; userId?: string },
  ) {
    if (!payload?.postId) {
      return;
    }

    client.join(`post:${payload.postId}`);
  }

  @SubscribeMessage('leave-post-room')
  leavePostRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { postId?: string },
  ) {
    if (!payload?.postId) {
      return;
    }

    client.leave(`post:${payload.postId}`);
  }

  emitCommentAdded(postId: string, comment: any) {
    this.server.to(`post:${postId}`).emit('post:comment-added', { comment });
  }

  emitCommentUpdated(postId: string, payload: any) {
    this.server.to(`post:${postId}`).emit('post:comment-updated', payload);
  }
}
