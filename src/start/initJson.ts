export function initJson() {
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };
}
