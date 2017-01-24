namespace casper {
    enum Mode {
        Exact, IgnoreCase, Regex,
        LessThan, GreaterThan, LessThanEqual,
        GreaterThanEqual, In, Between
    }

    export class CasperUtils {
        private constructor() {
        }

        public static Mode = Mode;

        public static compare(source: any, field: string, value: any, mode: Mode = CasperUtils.Mode.Exact): number {
            let o: any = source[field],
                v: any,
                regex: RegExp;

            if (o instanceof Number && !(value instanceof Array)) {
                return o < value ? -1 : o > value ? 1 : 0;
            } else if (value instanceof Array) {
                for (v of value) {
                    if (o == v) {
                        return 0;
                    }
                }

                return -1;
            } else if (typeof o === "string") {
                if (mode === CasperUtils.Mode.IgnoreCase) {
                    return o.toLowerCase() == value.toLowerCase() ? 0 : -1;
                } else if (mode === CasperUtils.Mode.Regex) {
                    regex = new RegExp(value);
                    return regex.test(o) ? 0 : -1;
                }
            }

            return o == value ? 0 : -1;
        }

        public static getId(): string {
            let chars: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
                result: string = '',
                i: number;

            for (i = 0; i < 32; ++i)
                result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }

        public static getHash(str: string): string {
            let hash: number = 0,
                c: number,
                i: number;

            if (str.length === 0) {
                return hash.toString();
            }

            for (i = 0; i < str.length; ++i) {
                c = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash |= 0;
            }

            return hash.toString();
        }
    }
}