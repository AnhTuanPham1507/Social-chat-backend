export const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};

export const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
