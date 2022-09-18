export const escapeStr = (str: string) => {
    return str.replace(/"/g, '<U+0022>');
};
