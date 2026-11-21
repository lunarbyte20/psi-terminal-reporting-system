export type User = {
    locale: 'en' | 'fil';
    theme: 'light' | 'dark' | 'system' | null;
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    role: string | null;
    /** For showing navigation only; the server checks every action again. */
    can: {
        administer: boolean;
        viewAllTerminals: boolean;
    };
};

export type Passkey = {
    locale: 'en' | 'fil';
    theme: 'light' | 'dark' | 'system' | null;
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
