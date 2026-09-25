import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { AuthGuard } from '../common/guards/auth.guard';

// Mock AuthGuard để tránh inject RedisService + PrismaService trong unit test
const mockAuthGuard = { canActivate: jest.fn(() => true) };

describe('UserController', () => {
  let controller: UserController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCustomLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLoggerService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {} as CreateUserDto;
      const expectedResult = { id: '1', email: 'test@test.com' };

      mockUserService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(result).toBe(expectedResult);
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserService.create).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct DTO to the service', async () => {
      const createUserDto: CreateUserDto = {} as CreateUserDto;

      mockUserService.create.mockResolvedValue('result');

      await controller.create(createUserDto);

      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should return whatever the service returns', async () => {
      const createUserDto: CreateUserDto = {} as CreateUserDto;
      const serviceResponse = { id: 'uuid-123', username: 'testuser' };

      mockUserService.create.mockResolvedValue(serviceResponse);

      const result = await controller.create(createUserDto);

      expect(result).toBe(serviceResponse);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedResult = [{ id: '1' }, { id: '2' }];

      mockUserService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toBe(expectedResult);
      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call service without any parameters', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(mockUserService.findAll).toHaveBeenCalledWith();
    });

    it('should return whatever the service returns', async () => {
      const serviceResponse = [{ id: 'uuid-1' }, { id: 'uuid-2' }];

      mockUserService.findAll.mockResolvedValue(serviceResponse);

      const result = await controller.findAll();

      expect(result).toBe(serviceResponse);
    });
  });

  describe('findOne', () => {
    it('should return a single user by id', async () => {
      const userId = 'uuid-abc-123';
      const expectedResult = { id: userId, email: 'user@test.com' };

      mockUserService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(userId);

      expect(result).toBe(expectedResult);
      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should pass the string id directly to service', async () => {
      const userId = 'uuid-xyz-456';

      mockUserService.findOne.mockResolvedValue({ id: userId });

      await controller.findOne(userId);

      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should work with different ids', async () => {
      const userId = 'uuid-999-aaa';

      mockUserService.findOne.mockResolvedValue({ id: userId });

      await controller.findOne(userId);

      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should return whatever the service returns', async () => {
      const userId = 'uuid-555';
      const serviceResponse = { id: userId, username: 'someone' };

      mockUserService.findOne.mockResolvedValue(serviceResponse);

      const result = await controller.findOne(userId);

      expect(result).toBe(serviceResponse);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'uuid-update-1';
      const updateUserDto: UpdateUserDto = {};
      const expectedResult = { id: userId, updated: true };

      mockUserService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(userId, updateUserDto);

      expect(result).toBe(expectedResult);
      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(mockUserService.update).toHaveBeenCalledTimes(1);
    });

    it('should pass the string id directly to service', async () => {
      const userId = 'uuid-update-10';
      const updateUserDto: UpdateUserDto = {};

      mockUserService.update.mockResolvedValue({ id: userId });

      await controller.update(userId, updateUserDto);

      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should pass the correct DTO to the service', async () => {
      const userId = 'uuid-update-7';
      const updateUserDto: UpdateUserDto = { username: 'newname' } as UpdateUserDto;

      mockUserService.update.mockResolvedValue({ id: userId });

      await controller.update(userId, updateUserDto);

      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should return whatever the service returns', async () => {
      const userId = 'uuid-update-3';
      const updateUserDto: UpdateUserDto = {};
      const serviceResponse = { id: userId, message: 'User updated successfully' };

      mockUserService.update.mockResolvedValue(serviceResponse);

      const result = await controller.update(userId, updateUserDto);

      expect(result).toBe(serviceResponse);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = 'uuid-remove-1';
      const expectedResult = { success: true };

      mockUserService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(userId);

      expect(result).toBe(expectedResult);
      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
      expect(mockUserService.remove).toHaveBeenCalledTimes(1);
    });

    it('should pass the string id directly to service', async () => {
      const userId = 'uuid-remove-25';

      mockUserService.remove.mockResolvedValue({ success: true });

      await controller.remove(userId);

      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
    });

    it('should work with different ids', async () => {
      const userId = 'uuid-remove-888';

      mockUserService.remove.mockResolvedValue({ success: true });

      await controller.remove(userId);

      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
    });

    it('should return whatever the service returns', async () => {
      const userId = 'uuid-remove-12';
      const serviceResponse = { success: true, message: 'User deleted successfully' };

      mockUserService.remove.mockResolvedValue(serviceResponse);

      const result = await controller.remove(userId);

      expect(result).toBe(serviceResponse);
    });
  });
});
