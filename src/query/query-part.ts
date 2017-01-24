namespace casper {
    export class QueryPart {

        private command: Command;
        private value: any;

        public static Command = Command;

        constructor(command: Command, value: any) {
            this.command = command;
            this.value = value;
        }

        public getCommand(): Command {
            return this.command;
        }

        public getValue(): any {
            return this.value;
        }
    }

    enum Command {
        And, Or, Where,
        Eq, Ne, Lt, Le,
        Gt, Ge, Lg, Like,
        In, Between, Not,
        Limit
    }
}