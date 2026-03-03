# 📚 Patterns Cheatsheet for sproux-service

Quick reference for patterns used in this codebase. Use this while implementing stories.

---

## 🏛️ Architecture Overview

```
apps/
├── auth/           # Authentication microservice (port 3000)
├── user/           # User management microservice (port 3001)
├── post/           # Content microservice (future)
├── message/        # Messaging microservice (future)
└── notification/   # Notification microservice (future)

packages/
├── common/         # Shared utilities, guards, decorators, configs
├── domain/         # Domain entities, value objects, events
└── infrastructure/ # Database, Redis, MinIO, external services
```

---

## 🧅 Hexagonal Architecture Layers

### Layer 1: Domain (`packages/domain/`)
**Purpose:** Business logic, entities, value objects, domain events
**Dependencies:** NONE (pure TypeScript)

```typescript
// Entity with factory method
export class UserEntity extends AggregateRoot<string> {
  private constructor(props: UserProps, id?: string) {
    super(id);
    // ...
  }

  // Factory method - use this to create
  static create(props: CreateUserProps): UserEntity {
    // validation + business rules
    const user = new UserEntity(props);
    user.addDomainEvent(new UserCreatedEvent(user));
    return user;
  }

  // Business method - logic lives here
  updateDisplayName(name: string): void {
    if (name.length < 2 || name.length > 50) {
      throw new InvalidDisplayNameException(name);
    }
    this._displayName = name;
    this.addDomainEvent(new UserProfileUpdatedEvent(this));
  }
}
```

### Layer 2: Application (`apps/*/src/application/`)
**Purpose:** Orchestration, use cases, ports (contracts)
**Dependencies:** Domain only

```typescript
// Contract (Port) - interface for infrastructure
export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  insert(user: UserEntity): Promise<void>;
  update(user: UserEntity): Promise<void>;
}
export const USER_REPO_TOKEN = Symbol('USER_REPO_TOKEN');

// Application Service - orchestrates, no business logic
@Injectable()
export class UserApplicationService {
  constructor(
    @Inject(USER_REPO_TOKEN)
    private readonly _userRepo: IUserRepository,
  ) {}

  async updateProfile(email: string, input: UpdateProfileInput): Promise<User> {
    // 1. Load entity
    const user = await this._userRepo.findByEmail(email);
    if (!user) throw new NotFoundException();

    // 2. Call domain method (business logic in entity)
    user.updateDisplayName(input.displayName);

    // 3. Persist
    await this._userRepo.update(user);

    // 4. Return DTO
    return UserAppMapper.toAppModel(user);
  }
}
```

### Layer 3: Infrastructure - Driven Adapters (`apps/*/src/driven-adapters/`)
**Purpose:** Implement ports (repositories, external services)
**Dependencies:** Application contracts, infrastructure packages

```typescript
// Repository Adapter - implements the port
@Injectable()
export class UserRepositoryAdapter implements IUserRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly _repo: Repository<UserModel>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const model = await this._repo.findOne({ where: { email } });
    return model ? UserPersistenceMapper.toDomain(model) : null;
  }

  async update(user: UserEntity): Promise<void> {
    const model = UserPersistenceMapper.toPersistence(user);
    await this._repo.save(model);
  }
}
```

### Layer 4: Presentation - Driving Adapters (`apps/*/src/driving-adapters/`)
**Purpose:** HTTP controllers, DTOs, request validation
**Dependencies:** Application services

```typescript
// Request DTO with validation
export class UpdateProfileDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName: string;
}

// Response DTO
export class UserDTO {
  id: string;
  email: string;
  displayName: string;
}

// Controller
@Controller('/users')
@UseGuards(JwtGuard)
export class UserController {
  constructor(
    @Inject(USER_APPLICATION_SERVICE_TOKEN)
    private readonly _userService: IUserApplicationService,
  ) {}

  @Put('/profile')
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDTO,
  ): Promise<UserDTO> {
    const email = req.user.email;
    const result = await this._userService.updateProfile(email, dto);
    return UserMapper.toDTO(result);
  }
}
```

---

## 🎯 Common Patterns

### Value Object
```typescript
export class EmailVO extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  static create(email: string): EmailVO {
    if (!this.isValid(email)) {
      throw new InvalidEmailException(email);
    }
    return new EmailVO({ value: email.toLowerCase() });
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get value(): string {
    return this.props.value;
  }
}
```

### Domain Event
```typescript
export class UserCreatedEvent extends DomainEvent {
  constructor(public readonly user: UserEntity) {
    super();
  }

  get eventName(): string {
    return 'user.created';
  }
}
```

### Domain Exception
```typescript
export class InvalidDisplayNameException extends DomainException {
  constructor(name: string) {
    super(`Display name "${name}" must be 2-50 characters`);
  }
}
```

### Mapper Pattern
```typescript
// Persistence Mapper (Entity <-> ORM Model)
export class UserPersistenceMapper {
  static toDomain(model: UserModel): UserEntity {
    return UserEntity.reconstitute({
      id: model.id,
      email: model.email,
      displayName: model.displayName,
    });
  }

  static toPersistence(entity: UserEntity): Partial<UserModel> {
    return {
      id: entity.id,
      email: entity.email.value,
      displayName: entity.displayName,
    };
  }
}

// App Mapper (Entity -> App DTO)
export class UserAppMapper {
  static toAppModel(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email.value,
      displayName: entity.displayName,
    };
  }
}

// Presentation Mapper (App DTO -> Response DTO)
export class UserMapper {
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
```

---

## 🔌 Dependency Injection

### Token Pattern
```typescript
// Define token
export const USER_REPO_TOKEN = Symbol('USER_REPO_TOKEN');

// Register in module
@Module({
  providers: [
    {
      provide: USER_REPO_TOKEN,
      useClass: UserRepositoryAdapter,
    },
  ],
})

// Inject
constructor(
  @Inject(USER_REPO_TOKEN)
  private readonly _userRepo: IUserRepository,
) {}
```

---

## ✅ Validation

### DTO Validation (class-validator)
```typescript
import { IsString, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';

export class UpdateProfileDTO {
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(50, { message: 'Display name must not exceed 50 characters' })
  displayName: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
```

### Domain Validation (in Entity)
```typescript
// Business rules validated in domain layer
updateDisplayName(name: string): void {
  if (name.length < 2 || name.length > 50) {
    throw new InvalidDisplayNameException(name);
  }
  // Additional business rules...
  this._displayName = name;
}
```

---

## 📁 File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{name}.entity.ts` | `user.entity.ts` |
| Value Object | `{name}.value-object.ts` | `email.value-object.ts` |
| Domain Event | `{name}.event.ts` | `user-created.event.ts` |
| Contract/Port | `{name}.contract.ts` | `user-repository.contract.ts` |
| Adapter | `{name}.adapter.ts` | `user-repository.adapter.ts` |
| DTO | `{name}.dto.ts` | `user.dto.ts` |
| Mapper | `{name}.mapper.ts` | `user.mapper.ts` |
| Controller | `{name}.controller.ts` | `user.controller.ts` |

---

## 🧪 Testing Patterns

### Unit Test (Domain)
```typescript
describe('UserEntity', () => {
  it('should update display name', () => {
    const user = UserEntity.create({ email: 'test@test.com', fullName: 'Test' });
    user.updateDisplayName('New Name');
    expect(user.displayName).toBe('New Name');
  });

  it('should throw on invalid display name', () => {
    const user = UserEntity.create({ email: 'test@test.com', fullName: 'Test' });
    expect(() => user.updateDisplayName('X')).toThrow(InvalidDisplayNameException);
  });
});
```

---

## 🔗 Useful Commands

```bash
# Start auth service
yarn start:dev auth

# Start user service
yarn start:dev user

# Run tests
yarn test

# Generate migration
yarn migration:generate src/migrations/AddUserAvatar

# Run migration
yarn migration:run
```
