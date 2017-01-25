/// <reference path="collection.ts" />

namespace casper {
    export class Database {
        private database: any;
        [key: string]: any;

        constructor() {
            this.database = {};
        }

        public createCollection(name: string, options: any): void {
            if (!this.database[name] && !this[name]) {
                this.database[name] = new Collection(options);
                this[name] = this.database[name];
            }
        }

        public getCollection(name: string): Collection {
            return this.database[name];
        }

        public dropCollection(name: string): void {
            if (this.database[name])
                delete this.database[name];
        }
    }
}