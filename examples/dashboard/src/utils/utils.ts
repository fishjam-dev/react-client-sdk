export const isInt = (str: string) => !isNaN(parseInt(str));

export const parseIntOrNull = (str: string) => (isInt(str) ? parseInt(str) : null);
