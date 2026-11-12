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
    @MessageBody() payload: { postId?: string; userId?: string } | string,
  ) {
    const postId = typeof payload === 'string' ? payload : payload?.postId;
    if (!postId) {
      return;
    }

    void client.join(`post:${postId}`);
  }

  @SubscribeMessage('leave-post-room')
  leavePostRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { postId?: string } | string,
  ) {
    const postId = typeof payload === 'string' ? payload : payload?.postId;
    if (!postId) {
      return;
    }

    void client.leave(`post:${postId}`);
  }

  emitCommentAdded(postId: string, comment: any) {
    this.server.to(`post:${postId}`).emit('post:comment-added', { comment });
  }

  emitCommentUpdated(postId: string, payload: any) {
    this.server.to(`post:${postId}`).emit('post:comment-updated', payload);
  }

  emitLikeUpdated(postId: string, likeCount: number) {
    this.server
      .to(`post:${postId}`)
      .emit('post:like-updated', { postId, likeCount: Math.max(0, likeCount) });
  }

  emitPostModerated(
    postId: string,
    payload: { status: string; reason?: string | null },
  ) {
    this.server
      .to(`post:${postId}`)
      .emit('post:moderated', { postId, ...payload });
  }

  /** Broadcast toàn cục: mọi client gỡ bài khỏi Feed */
  emitPostHidden(postId: string) {
    this.server.emit('post:hidden', { postId });
  }

  /** Broadcast toàn cục: bài được khôi phục (AI bắt nhầm) */
  emitPostRestored(postId: string) {
    this.server.emit('post:restored', { postId });
  }

  /** Broadcast tới màn hình CMS Moderation khi có báo cáo mới từ AI hoặc người dùng */
  emitModerationEvent(payload: {
    type: 'report-created' | 'report-resolved';
    reportId?: string;
    targetId?: string;
  }) {
    this.server.emit('moderation:updated', payload);
  }

  /** Broadcast khi số lượng người theo dõi của một thành viên thay đổi */
  emitFollowUpdated(targetUserId: string, followerCount: number) {
    this.server.emit('user:follow-updated', {
      targetUserId,
      followerCount: Math.max(0, followerCount),
    });
  }
}
