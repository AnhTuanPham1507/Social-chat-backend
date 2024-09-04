import { BadRequestException, Injectable } from "@nestjs/common";
import { MulterModuleOptions, MulterOptionsFactory } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { MimeType } from "src/core/enums/mime-type.enum";

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
    createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions {
        const LIMIT_FIVE_MEGABYTES = 5242880;
        const LIMIT_FOUR_FILES = 4;

        return {
            storage: memoryStorage(),
            limits: {
                fileSize: Number.parseInt(process.env.LIMIT_FILE_SIZE_MB)
                    || LIMIT_FIVE_MEGABYTES,
                files: Number.parseInt(process.env.LIMIT_FILE_NUM)
                    || LIMIT_FOUR_FILES,
            },
            fileFilter: (req, file, callback) => {
                const isValidFile = Object.values(MimeType).includes(file.mimetype as MimeType);
                // Check if file MIME type is in the allowed list
                if (isValidFile) {
                    callback(null, true); // Accept the file
                } else {
                    callback(
                        new BadRequestException('Tệp tin không hợp lệ'),
                        false,
                    ); // Reject the file
                }
            },
        };
    }
}