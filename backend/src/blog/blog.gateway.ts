import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: false,
  },
})
export class BlogGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    client.emit('connected', {
      ok: true,
      socketId: client.id,
      message: 'Connected to blog realtime server',
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('join-post-room')
  joinPostRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { postId: string; userId?: string },
  ) {
    if (!payload?.postId) {
      client.emit('error', { message: 'postId is required' });
      return;
    }

    client.join(`post:${payload.postId}`);

    if (payload.userId) {
      this.connectedUsers.set(client.id, payload.userId);
    }

    client.emit('joined-post-room', {
      postId: payload.postId,
      room: `post:${payload.postId}`,
    });
  }

  @SubscribeMessage('leave-post-room')
  leavePostRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { postId: string },
  ) {
    if (!payload?.postId) {
      return;
    }

    client.leave(`post:${payload.postId}`);
    client.emit('left-post-room', { postId: payload.postId });
  }

  emitCommentAdded(postId: string, payload: unknown) {
    this.server.to(`post:${postId}`).emit('post:comment-added', payload);
  }

  emitCommentUpdated(postId: string, payload: unknown) {
    this.server.to(`post:${postId}`).emit('post:comment-updated', payload);
  }

  emitPostLiked(postId: string, payload: unknown) {
    this.server.to(`post:${postId}`).emit('post:liked', payload);
  }

  emitPostModerated(postId: string, payload: unknown) {
    this.server.to(`post:${postId}`).emit('post:moderated', payload);
  }
}
