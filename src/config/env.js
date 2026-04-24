import dotenv from 'dotenv';

dotenv.config();

function requiredEnv(name) {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`Environment variable ${name} is required but not defined.`);
    }
    return value;
}

function toNumber(value, fallback) {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
}

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: toNumber(process.env.PORT, 3000),
    openaiApiKey: requiredEnv('OPENAI_API_KEY'),
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    logLevel: process.env.LOG_LEVEL || 'debug',
    maxSteps: toNumber(process.env.MAX_STEPS, 5),
}