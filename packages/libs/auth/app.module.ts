import { IKeycloakConfig } from "@social-chat/common";
import {  KeycloakApiClient } from "./services/keycloak.service";
import { Module, DynamicModule } from "@nestjs/common";
import { JwtStrategy } from "./strategies";

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
      ],
      exports: [KeycloakApiClient],
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
        JwtStrategy
      ],
      exports: [KeycloakApiClient, JwtStrategy],
    };
  }
}