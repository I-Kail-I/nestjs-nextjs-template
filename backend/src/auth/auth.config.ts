import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaClient } from "generated/prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    basePath: "/api/auth",
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, 
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, 
        },
    },
});

// Export the auth instance type for the NestJS wrapper
export type Auth = typeof auth;