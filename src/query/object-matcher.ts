/// <reference path="../utils/casper-utils.ts" />

namespace casper {
    export class ObjectMatcher {

        private result: boolean;
        private skipNext: boolean;
        private negate: boolean;
        private source: any;
        private sourceClass: any;
        private field: any;

        private constructor(source: any) {
            this.result = false;
            this.skipNext = false;
            this.negate = false;
            this.source = source;
            this.sourceClass = null;
            this.field = null;
        }

        public static match(source: any): ObjectMatcher {
            return new ObjectMatcher(source);
        }

        public getSource(): any {
            return this.source;
        }

        public getSourceClass(): any {
            return this.sourceClass;
        }

        public getField(): string {
            return this.field;
        }

        public isMatch(): boolean {
            return this.result;
        }

        private test(value: any, mode: any): ObjectMatcher {
            if (this.skipNext) {
                this.skipNext = false;
                this.negate = false;
                return this;
            }

            let result = CasperUtils.compare(this.source, this.field, value, mode);

            if (mode == CasperUtils.Mode.LessThan) {
                this.result = this.negate != (result < 0);
            } else if (mode == CasperUtils.Mode.GreaterThan) {
                this.result = this.negate != (result > 0);
            } else if (mode == CasperUtils.Mode.LessThanEqual) {
                this.result = this.negate != (result <= 0);
            } else if (mode == CasperUtils.Mode.GreaterThanEqual) {
                this.result = this.negate != (result >= 0);
            } else {
                this.result = this.negate != (result == 0);
            }

            this.negate = false;
            return this;
        }

        public where(field: string): ObjectMatcher {
            this.field = field;
            return this;
        };

        public and(field: string): ObjectMatcher {
            this.field = field;
            this.skipNext = !this.result;
            return this;
        };

        public or(field: string): ObjectMatcher {
            this.field = field;
            this.skipNext = this.result;
            return this;
        }

        public not(): ObjectMatcher {
            this.negate = true;
            return this;
        }

        public eq(value: any): ObjectMatcher {
            return this.test(value, CasperUtils.Mode.Exact);
        }

        public ne(value: any): ObjectMatcher {
            this.negate = true;
            return this.eq(value);
        }

        public lg(value: any): ObjectMatcher {
            return this.ne(value);
        }

        public lt(value: any): ObjectMatcher {
            return this.test(value, CasperUtils.Mode.LessThan);
        }

        public gt(value: any): ObjectMatcher {
            return this.test(value, CasperUtils.Mode.GreaterThan);
        }

        public le(value: any): ObjectMatcher {
            return this.test(value, CasperUtils.Mode.LessThanEqual);
        }

        public ge(value: any): ObjectMatcher {
            return this.test(value, CasperUtils.Mode.GreaterThanEqual);
        }

        public like(value: string): ObjectMatcher {
            value = value.replace(/\\%/g, '$$$$__PERCENT__$$$$');
            value = value.replace(/%/g, '%$$$$__WILDCARD__$$$$%');
            let parts = value.split('%');

            let sb = '';
            for (let part of parts) {
                switch (part) {
                    case '$$__WILDCARD__$$':
                        sb += '(.*)';
                        break;
                    case '$$__PERCENT__$$':
                        sb += '%';
                        break;
                    default:
                        sb += part;
                }
            }

            return this.test(sb, CasperUtils.Mode.Regex);
        }

        public in(values: any): ObjectMatcher {
            return this.test(values, CasperUtils.Mode.In);
        }

        public between(start: number, end: number): ObjectMatcher {
            let s: number, e: number, i: number;
            if (this.skipNext) {
                this.skipNext = false;
                this.negate = false;
                return this;
            }

            if (start > end) {
                s = end;
                e = start;
            } else if (start < end) {
                s = start;
                e = end;
            } else {
                return this.test(start, CasperUtils.Mode.Exact);
            }

            for (i = s; i <= e; ++i) {
                if (CasperUtils.compare(this.source, this.field, i, CasperUtils.Mode.Between) == 0) {
                    this.result = !this.negate;
                    this.negate = false;
                    return this;
                }
            }

            this.result = this.negate;
            this.negate = false;
            return this;
        }
    }
}