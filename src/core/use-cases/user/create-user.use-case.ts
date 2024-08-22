import CreateUserDTO from '../../../core/dtos/create-user.dto';
import UserDTO from '../../../core/dtos/user.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../../core/entities/user.entity';
import { generateHash } from '../../../core/helpers/hash.helper';
import { DIToken } from '../../../core/enums/di-tokens.enum';
import { IUseCase } from '../../../core/interfaces/base-use-case.interface';
import { IUserRepo } from '../../../core/interfaces/user-repo.interface';
import { IQueueService } from '../../../core/interfaces/queue-service.interface';
import { EventActions } from '../../../core/enums/event-actioon.enum';
import { QueueName } from '../../../core/enums/queue-name';
import { Role } from 'src/core/enums/role.enum';

export interface ICreateUserUseCase extends IUseCase<CreateUserDTO, UserDTO> {}

@Injectable()
export class CreateUserUseCase implements ICreateUserUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,

        @Inject(DIToken.QUEUE_SERVICE)
        public readonly queueService: IQueueService,
    ) {}

    async execute(payload: CreateUserDTO): Promise<UserDTO> {
        const userEntity = new UserEntity(
            Role.USER,
            payload.fullName,
            payload.email,
            payload.phone,
            payload.password,
            payload.sex,
        );

        const isExisted = await this.userRepo.exists(userEntity, [
            'email',
            'phone',
        ]);
        if (isExisted) {
            throw new BadRequestException(
                'Email hoặc số điện thoại đã tồn tại',
            );
        }

        userEntity.password = generateHash(userEntity.password);

        await this.userRepo.save(userEntity);

        this.queueService.sendMessage(
            QueueName.USER,
            userEntity,
            EventActions.CREATE,
        );

        return new UserDTO(userEntity);
    }
}
