import { Test } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { REDIS_CLIENT } from '../modules/redis.module';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  const client = {
    status: 'ready',
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    incrby: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    flushall: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  const down = () => Promise.reject(new Error('ECONNREFUSED'));

  beforeEach(async () => {
    jest.resetAllMocks();
    client.status = 'ready';
    const moduleRef = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: REDIS_CLIENT, useValue: client },
        { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
      ],
    }).compile();
    service = moduleRef.get(RedisService);
  });

  describe('get / set', () => {
    it('lưu dạng JSON, có TTL thì dùng SETEX', async () => {
      await expect(service.set('k', { a: 1 }, 60)).resolves.toBe(true);
      expect(client.setex).toHaveBeenCalledWith('k', 60, '{"a":1}');

      await service.set('k2', [1, 2]);
      expect(client.set).toHaveBeenCalledWith('k2', '[1,2]');
    });

    it('đọc lại đúng kiểu đã lưu; không có key thì null', async () => {
      client.get.mockResolvedValueOnce('{"a":1}').mockResolvedValueOnce(null);

      await expect(service.get('k')).resolves.toEqual({ a: 1 });
      await expect(service.get('khong-co')).resolves.toBeNull();
    });

    it('Redis mất kết nối: get trả null, set trả false, không ném lỗi', async () => {
      client.get.mockImplementation(down);
      client.setex.mockImplementation(down);

      await expect(service.get('k')).resolves.toBeNull();
      await expect(service.set('k', 1, 60)).resolves.toBe(false);
      expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('giá trị hỏng (không phải JSON) thì coi như không có', async () => {
      client.get.mockResolvedValue('{hong');

      await expect(service.get('k')).resolves.toBeNull();
    });
  });

  describe('setNX — khoá phân tán', () => {
    it('lấy được khoá khi key chưa có, kèm hạn', async () => {
      client.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

      await expect(service.setNX('lock', '1', 5)).resolves.toBe(true);
      await expect(service.setNX('lock', '1', 5)).resolves.toBe(false);
      expect(client.set).toHaveBeenCalledWith('lock', '"1"', 'EX', 5, 'NX');
    });

    it('Redis lỗi thì coi như không lấy được khoá', async () => {
      client.set.mockImplementation(down);

      await expect(service.setNX('lock', '1', 5)).resolves.toBe(false);
    });
  });

  describe('xoá', () => {
    it('xoá 1 key / nhiều key; danh sách rỗng không gọi Redis', async () => {
      client.del.mockResolvedValue(2);

      await expect(service.delMany([])).resolves.toBe(0);
      expect(client.del).not.toHaveBeenCalled();
      await expect(service.delMany(['a', 'b'])).resolves.toBe(2);
      expect(client.del).toHaveBeenCalledWith('a', 'b');
    });

    it('xoá theo mẫu duyệt hết các trang SCAN (không dùng KEYS)', async () => {
      client.scan
        .mockResolvedValueOnce(['7', ['lesson:1', 'lesson:2']])
        .mockResolvedValueOnce(['0', ['lesson:3']]);
      client.del.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

      await expect(service.deleteByPattern('lesson:*')).resolves.toBe(3);
      expect(client.scan).toHaveBeenNthCalledWith(
        2,
        '7',
        'MATCH',
        'lesson:*',
        'COUNT',
        100,
      );
    });

    it('lỗi giữa chừng thì trả số key đã xoá được', async () => {
      client.scan
        .mockResolvedValueOnce(['7', ['a']])
        .mockImplementationOnce(down);
      client.del.mockResolvedValueOnce(1);

      await expect(service.deleteByPattern('*')).resolves.toBe(1);
    });

    it('del lỗi trả 0', async () => {
      client.del.mockImplementation(down);

      await expect(service.del('k')).resolves.toBe(0);
    });
  });

  describe('đếm, hạn, tồn tại', () => {
    it('incr dùng INCR khi tăng 1, INCRBY khi tăng nhiều; lỗi trả null', async () => {
      client.incr.mockResolvedValue(1);
      client.incrby.mockResolvedValue(6);

      await expect(service.incr('dem')).resolves.toBe(1);
      await expect(service.incr('dem', 5)).resolves.toBe(6);

      client.incr.mockImplementation(down);
      await expect(service.incr('dem')).resolves.toBeNull();
    });

    it('exists / expire chuyển kết quả số thành boolean; ttl lỗi trả -2', async () => {
      client.exists.mockResolvedValue(1);
      client.expire.mockResolvedValue(0);
      client.ttl.mockImplementation(down);

      await expect(service.exists('k')).resolves.toBe(true);
      await expect(service.expire('k', 10)).resolves.toBe(false);
      await expect(service.ttl('k')).resolves.toBe(-2);
    });
  });

  describe('hash', () => {
    it('hset giữ nguyên chuỗi, JSON hoá giá trị khác; hget đọc được cả hai', async () => {
      await service.hset('h', 'ten', 'Ngô Quyền');
      await service.hset('h', 'nam', { sinh: 897 });
      expect(client.hset).toHaveBeenNthCalledWith(1, 'h', 'ten', 'Ngô Quyền');
      expect(client.hset).toHaveBeenNthCalledWith(
        2,
        'h',
        'nam',
        '{"sinh":897}',
      );

      client.hget
        .mockResolvedValueOnce('Ngô Quyền')
        .mockResolvedValueOnce('{"sinh":897}');
      await expect(service.hget('h', 'ten')).resolves.toBe('Ngô Quyền');
      await expect(service.hget('h', 'nam')).resolves.toEqual({ sinh: 897 });
    });

    it('hgetall rỗng trả null; hdel trả có xoá được hay không', async () => {
      client.hgetall.mockResolvedValue({});
      client.hdel.mockResolvedValue(1);

      await expect(service.hgetall('h')).resolves.toBeNull();
      await expect(service.hdel('h', 'ten')).resolves.toBe(true);
    });
  });

  describe('vận hành', () => {
    it('kiểm tra kết nối khi khởi động: lỗi chỉ ghi log, không làm sập ứng dụng', async () => {
      client.ping.mockImplementation(down);

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('isReady theo trạng thái client', () => {
      expect(service.isReady()).toBe(true);
      client.status = 'reconnecting';
      expect(service.isReady()).toBe(false);
    });

    it('flushAll bị chặn trên production', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await service.flushAll();
      } finally {
        process.env.NODE_ENV = original;
      }

      expect(client.flushall).not.toHaveBeenCalled();
    });
  });
});
