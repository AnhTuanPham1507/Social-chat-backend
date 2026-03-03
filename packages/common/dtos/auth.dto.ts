import { Expose } from 'class-transformer';

export class TokenResponseDTO {
    @Expose({ name: 'id_token' })
    idToken: string;
    @Expose({ name: 'access_token' })
    accessToken: string;
    @Expose({ name: 'expires_in' })
    expiresIn: number;
    @Expose({ name: 'refresh_expires_in' })
    refreshExpiresIn: number;
    @Expose({ name: 'refresh_token' })
    refreshToken: string;
    @Expose({ name: 'token_type' })
    tokenType: string;
    @Expose({ name: 'not-before-policy' })
    notBeforePolicy: number;
    @Expose({ name: 'session_state' })
    sessionState: string;
    @Expose({ name: 'scope' })
    scope: string;
}

export class PublicKeyDTO {
    @Expose({ name: 'kid' })
    kid: string; // Key ID (used in JWT header)
    @Expose({ name: 'kty' })
    kty: string; // Key type (usually "RSA" or "EC")
    @Expose({ name: 'alg' })
    alg: string; // Algorithm (e.g. "RS256")
    @Expose({ name: 'use' })
    use: string; // Intended use, usually "sig" for signature
    @Expose({ name: 'n' })
    n: string; // RSA modulus (base64url-encoded)
    @Expose({ name: 'e' })
    e: string; // RSA exponent (base64url-encoded)
    @Expose({ name: 'x5c' })
    x5c: string[]; // (optional) X.509 certificate chain
    @Expose({ name: 'x5t' })
    x5t: string; // (optional) X.509 certificate SHA-1 thumbprint
    @Expose({ name: 'x5t#S256' })
    x5tS256: string; // (optional) SHA-256 thumbprint
}

export class GetPublicKeyResponseDTO {
    @Expose({ name: 'keys' })
    keys: PublicKeyDTO[];
}


