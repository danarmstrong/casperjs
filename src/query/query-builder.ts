/// <reference path="query-part.ts" />

namespace casper {
    enum Type {
        Find, Remove
    }

    export class QueryBuilder {

        private type: Type;
        private repository: string;
        private parts: any;

        public static Type = Type;

        constructor(repository?: string, type?: Type) {
            this.repository = repository;
            this.type = type;
            this.parts = [];
        }

        public getType(): Type {
            return this.type;
        }

        public getRepository(): string {
            return this.repository;
        }

        public getParts(): any {
            return this.parts;
        }

        public reset(): void {
            this.parts = [];
        }

        public add(command: any, value?: any): void {
            this.parts.push(new QueryPart(command, value));
        }
    }
}