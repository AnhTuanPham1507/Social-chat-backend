import { IKeycloakConfig, isProduction } from "@social-chat/common";
import {  KeycloakApiClient } from "./services/keycloak.service";
import { Module, DynamicModule } from "@nestjs/common";
import { JwtStrategy } from "./strategies";
import { RefreshTokenMiddleware, REFRESH_TOKEN_OPTIONS } from "./middlewares";

export const KEYCLOAK_MODULE_OPTIONS = Symbol('KEYCLOAK_MODULE_OPTIONS');

export interface KeycloakModuleOptions {
    config: IKeycloakConfig;
}

export interface KeycloakModuleAsyncOptions {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<KeycloakModuleOptions> | KeycloakModuleOptions;
    inject?: any[];
}

@Module({})
export class LibAuthModule {
  // Static configuration
  static forRoot(options: KeycloakModuleOptions): DynamicModule {
    return {
      module: LibAuthModule,
      providers: [
        {
          provide: KeycloakApiClient,
          useFactory: () => new KeycloakApiClient(options.config),
        },
        {
          provide: REFRESH_TOKEN_OPTIONS,
          useValue: { isProduction: isProduction() },
        },
        RefreshTokenMiddleware,
      ],
      exports: [KeycloakApiClient, REFRESH_TOKEN_OPTIONS, RefreshTokenMiddleware],
    };
  }

  // Async configuration with ConfigService
  static forRootAsync(options: KeycloakModuleAsyncOptions): DynamicModule {
    return {
      module: LibAuthModule,
      imports: options.imports || [],
      providers: [
        {
          provide: KeycloakApiClient,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return new KeycloakApiClient(config.config);
          },
          inject: options.inject || [],
        },
        {
          provide: REFRESH_TOKEN_OPTIONS,
          useValue: { isProduction: isProduction() },
        },
        JwtStrategy,
        RefreshTokenMiddleware,
      ],
      exports: [KeycloakApiClient, JwtStrategy, REFRESH_TOKEN_OPTIONS, RefreshTokenMiddleware],
    };
  }
}