const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migration1724123640698 {
    name = 'Migration1724123640698'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."user_sex_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" character varying NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(11) NOT NULL, "password" character varying(255) NOT NULL, "full_name" character varying(50) NOT NULL, "sex" "public"."user_sex_enum" NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_sex_enum"`);
    }
}
