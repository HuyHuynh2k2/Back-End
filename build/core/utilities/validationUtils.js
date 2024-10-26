"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationFunctions = void 0;
/**
 * Checks the parameter to see if it is a a String.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String0, false otherwise
 */
function isString(candidate) {
    return typeof candidate === 'string';
}
/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
function isStringProvided(candidate) {
    return isString(candidate) && candidate.length > 0;
}
/**
 * Checks the parameter to see if it can be converted into a number.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a number, false otherwise
 */
function isNumberProvided(candidate) {
    return (isNumber(candidate) ||
        (candidate != null &&
            candidate != '' &&
            !isNaN(Number(candidate.toString()))));
}
/**
 * Helper
 * @param x data value to check the type of
 * @returns true if the type of x is a number, false otherise
 */
function isNumber(x) {
    return typeof x === 'number';
}
// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any
const validationFunctions = {
    isStringProvided,
    isNumberProvided,
};
exports.validationFunctions = validationFunctions;
//# sourceMappingURL=validationUtils.js.map