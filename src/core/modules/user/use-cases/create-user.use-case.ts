import CreateUserDTO from '../../../../core/dtos/create-user.dto';
import UserDTO from '../../../../core/dtos/user.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../../../core/entities/user.entity';
import { DIToken } from '../../../../core/enums/di-tokens.enum';
import { IUseCase } from '../../../../core/interfaces/base-use-case.interface';
import { IUserRepo } from '../../../../core/interfaces/user-repo.interface';
import { IQueueService } from '../../../../core/interfaces/queue-service.interface';
import { EventActions } from '../../../enums/event-action.enum';
import { QueueName } from '../../../../core/enums/queue-name';
import { IHashDataService } from '../../../../core/interfaces/hash-data-service.interface';

export interface ICreateUserUseCase extends IUseCase<CreateUserDTO, UserDTO> {}

@Injectable()
export class CreateUserUseCase implements ICreateUserUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,

        @Inject(DIToken.QUEUE_SERVICE)
        public readonly queueService: IQueueService,

        @Inject(DIToken.HASH_SERVICE)
        public readonly hashService: IHashDataService,
    ) {}

    async execute(payload: CreateUserDTO): Promise<UserDTO> {
        const userEntity = UserEntity.createLocalUser(null, {
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            password: payload.password,
            sex: payload.sex,
            avatar: payload.uploadedAvatar,
        });

        const entity = await this.userRepo.findOne({
            selections: ['id'],
            queryParams: [
                {email: userEntity.email},
                {phone: userEntity.phone}
            ]
        });
        if (!!entity) {
            throw new BadRequestException(
                'Email hoặc số điện thoại đã tồn tại',
            );
        }

        userEntity.password = this.hashService.generateHash(
            userEntity.password,
        );

        await this.userRepo.create(userEntity);

        this.queueService.sendMessage(
            QueueName.USER,
            userEntity,
            EventActions.CREATE,
        );

        return new UserDTO(userEntity);
    }
}
