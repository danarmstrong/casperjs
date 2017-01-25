namespace casper {
    export class Exception extends Error {
        constructor(message?: string) {
            super(message);
            this.name = 'Exception';
            this.message = message;
            this.stack = (<any>new Error()).stack;
        }

        public getMessage() {
            return this.message;
        }
    }
}