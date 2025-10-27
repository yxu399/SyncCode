/**
 * Authentication types for JWT and session management
 */
export interface AccessTokenPayload {
    userId: string;
    email: string;
    username: string;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface RefreshToken {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface SignupCredentials {
    email: string;
    username: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string;
    };
    tokens: AuthTokens;
}
//# sourceMappingURL=auth.d.ts.map