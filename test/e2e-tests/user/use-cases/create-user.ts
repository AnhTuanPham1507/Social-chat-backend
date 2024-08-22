import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserController } from '../../../../src/core/modules/user/user.controller';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { MockedRabbitMQModule } from '../../../mocks/rabbitmq.mock';
import { UserModule } from '../../../../src/core/modules/user/user.module';
import { PostgresModule } from '../../../../src/infras/database/postgres.module';

export default function () {
    describe('Create', () => {
        let app: INestApplication;
        let dummyObject = {
            fullName: 'Phạm Anh Tuấn',
            password: '0943722631aA@',
            sex: 'MALE',
            email: 'phamanhtuan9a531@gmail.com',
            phone: '0778821404',
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

        it(`Validate field email`, async () => {
            const parameters = [
                {
                    ...dummyObject,
                    email: 'phamanhtuan',
                },
                {
                    ...dummyObject,
                    email: 778821404,
                },
                {
                    ...dummyObject,
                    email: null,
                },
                {
                    ...dummyObject,
                    email: undefined,
                },
            ];

            for (const parameter of parameters) {
                const result = await request(app.getHttpServer())
                    .post('/api/v1/user')
                    .send(parameter);
                expect(result.status).toBe(400);
            }
        });

        it(`Validate field sex`, async () => {
            const parameters = [
                {
                    ...dummyObject,
                    sex: 'phamanhtuan',
                },
                {
                    ...dummyObject,
                    sex: 778821404,
                },
                {
                    ...dummyObject,
                    sex: null,
                },
                {
                    ...dummyObject,
                    sex: undefined,
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

        it(`Duplicated email, phone`, async () => {
            await request(app.getHttpServer())
                .post('/api/v1/user')
                .send(dummyObject);

            const responseDuplicatedEmail = await request(app.getHttpServer())
                .post('/api/v1/user')
                .send({
                    ...dummyObject,
                    phone: faker.helpers.fromRegExp('077[1-9]{7}'),
                });

            const responseDuplicatedPhone = await request(app.getHttpServer())
                .post('/api/v1/user')
                .send({
                    ...dummyObject,
                    email: faker.internet.email(),
                });

            expect(responseDuplicatedEmail.status).toBe(400);
            expect(responseDuplicatedPhone.status).toBe(400);
        });
    });
}
