import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserModule } from '../../../../src/core/use-cases/user/user.module';
import { PostgresModule } from '../../../../src/frameworks/postgres/postgres.module';
import { UserController } from '../../../../src/presentation/controllers/user.controller';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { MockedRabbitMQModule } from '../../../mocks/rabbitmq.mock';

export default function () {
    describe('Create', () => {
        let app: INestApplication;
        let dummyObject = {
            fullName: 'Phạm Anh Tuấn',
            password: '0943722631aA@',
            sex: 'MALE',
            email: null,
            phone: null,
        };

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    MockedRabbitMQModule,
                    UserModule,
                    PostgresModule,
                    ConfigModule.forRoot({
                        envFilePath: `.development.env`,
                    }),
                ],
                controllers: [UserController],
            }).compile();

            app = moduleRef.createNestApplication();
            app.useGlobalPipes(
                new ValidationPipe({
                    whitelist: true,
                    transform: true,
                    dismissDefaultMessages: false,
                    validationError: {
                        target: true,
                    },
                }),
            );
            await app.init();
        });

        afterAll(async () => {
            await app.close();
        });

        beforeEach(() => {
            dummyObject.email = faker.internet.email();
            dummyObject.phone = faker.helpers.fromRegExp('077[1-9]{7}');
            jest.restoreAllMocks();
        });

        it(`Validate field fullName`, async () => {
            const parameters = [
                {
                    ...dummyObject,
                    fullName: '',
                },
                {
                    ...dummyObject,
                    fullName: 0,
                },
                {
                    ...dummyObject,
                    fullName: null,
                },
                {
                    ...dummyObject,
                    fullName: undefined,
                },
            ];

            for (const parameter of parameters) {
                const result = await request(app.getHttpServer())
                    .post('/api/v1/user')
                    .send(parameter);
                expect(result.status).toBe(400);
            }
        });

        it(`Validate field password`, async () => {
            const parameters = [
                {
                    ...dummyObject,
                    password: '0943722631',
                },
                {
                    ...dummyObject,
                    password: '0943722631a',
                },
                {
                    ...dummyObject,
                    password: '0943722631A',
                },
                {
                    ...dummyObject,
                    password: '0943722631@',
                },
                {
                    ...dummyObject,
                    password: '0943722631aA',
                },
                {
                    ...dummyObject,
                    password: '0943722631@A',
                },
                {
                    ...dummyObject,
                    password: 778821404,
                },
                {
                    ...dummyObject,
                    password: null,
                },
                {
                    ...dummyObject,
                    password: undefined,
                },
            ];

            for (const parameter of parameters) {
                const result = await request(app.getHttpServer())
                    .post('/api/v1/user')
                    .send(parameter);
                expect(result.status).toBe(400);
            }
        });

        it(`Validate field phone`, async () => {
            const parameters = [
                {
                    ...dummyObject,
                    phone: '077882####',
                },
                {
                    ...dummyObject,
                    phone: 778821404,
                },
                {
                    ...dummyObject,
                    phone: null,
                },
                {
                    ...dummyObject,
                    phone: undefined,
                },
            ];

            for (const parameter of parameters) {
                const result = await request(app.getHttpServer())
                    .post('/api/v1/user')
                    .send(parameter);
                expect(result.status).toBe(400);
            }
        });

        it(`Create user successfully`, async () => {
            const result = await request(app.getHttpServer())
                .post('/api/v1/user')
                .send(dummyObject);

            expect(result.status).toBe(201);
            expect(result._body.email).toBe(dummyObject.email);
            expect(result._body?.password).toBe(undefined);
        });
    });
}
