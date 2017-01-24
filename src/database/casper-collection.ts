/// <reference path="../utils/casper-utils.ts" />
/// <reference path="../query/list-query.ts" />

namespace casper {
    export class CasperCollection {

        private records: any;
        private indexes: any;
        private constraints: any;
        private triggers: any;
        private procedures: any;

        constructor(options?: any) {
            this.records = [];
            this.initIndexes();
            this.initConstraints();
            this.initTriggers();
            this.initProcedures();

            if (options) {
                if (options.constraints) {
                    for (let c in options.constraints) {
                        if (!options.constraints.hasOwnProperty(c))
                            continue;
                        this.addConstraint(c, options.constraints[c]);
                    }
                }

                if (options.triggers) {
                    if (options.triggers.beforeCreate)
                        this.triggers.beforeCreate = options.triggers.beforeCreate;
                    if (options.triggers.afterCreate)
                        this.triggers.afterCreate = options.triggers.afterCreate;
                    if (options.triggers.beforeUpdate)
                        this.triggers.beforeUpdate = options.triggers.beforeUpdate;
                    if (options.triggers.afterUpdate)
                        this.triggers.afterUpdate = options.triggers.afterUpdate;
                    if (options.triggers.beforeDelete)
                        this.triggers.beforeDelete = options.triggers.beforeDelete;
                    if (options.triggers.afterDelete)
                        this.triggers.afterDelete = options.triggers.afterDelete;
                }

                if (options.procedures) {
                    this.procedures = options.procedures;
                }
            }
        }

        private initIndexes(): void {
            this.indexes = {id: {}, unique: {}};
        }

        private initConstraints(): void {
            this.constraints = {
                unique: [],
                required: [],
                notNull: [],
                min: {},
                max: {},
                defaultsTo: {},
                pattern: {},
                type: {}
            };
        }

        private initTriggers(): void {
            this.triggers = {
                beforeCreate: {},
                afterCreate: {},
                beforeUpdate: {},
                afterUpdate: {},
                beforeDelete: {},
                afterDelete: {}
            };
        }

        private initProcedures(): void {
            this.procedures = {};
        }

        public getIndexes(): any {
            return this.indexes;
        }

        public getConstraints(): any {
            return this.constraints;
        }

        public rebuildIndexes(): void {
            let hash: string,
                u: any,
                i: number;

            this.initIndexes();
            for (i = 0; i < this.records.length; ++i) {
                this.indexes.id[this.records[i]._id] = i;
                for (u of this.constraints.unique) {
                    this.indexes.unique[u] = {};
                    if (this.records[i][u]) {
                        hash = typeof this.records[i][u] === 'string' ? CasperUtils.getHash(this.records[i][u]) : this.records[i][u];
                        this.indexes.unique[u][hash] = this.records[i]._id;
                    }
                }
            }
        };

        public addConstraint(field: string, constraint: any): void {
            if (constraint.unique) {
                if (this.constraints.unique.indexOf(field) < 0) {
                    this.constraints.unique.push(field);
                    this.indexes.unique[field] = {};
                }
            }

            if (constraint.required) {
                if (this.constraints.required.indexOf(field) < 0) {
                    this.constraints.required.push(field);
                }
            }

            if (constraint.notNull) {
                if (this.constraints.notNull.indexOf(field) < 0) {
                    this.constraints.notNull.push(field);
                }
            }

            if (constraint.min) {
                this.constraints.min[field] = constraint.min;
            }

            if (constraint.max) {
                this.constraints.max[field] = constraint.max;
            }

            if (constraint.defaultsTo) {
                this.constraints.defaultsTo[field] = constraint.defaultsTo;
            }

            if (constraint.pattern) {
                this.constraints.pattern[field] = constraint.pattern;
            }

            if (constraint.type) {
                this.constraints.type[field] = constraint.type;
            }
        }

        public addTrigger(event: string, name: string, fn: any): void {
            this.triggers[event][name] = fn;
        }

        public dropTrigger(event: string, name: string): void {
            delete this.triggers[event][name];
        }

        private runTriggers(event: string, source: any): void {
            if (this.triggers[event] === undefined)
                return;
            for (var t in this.triggers[event]) {
                this.triggers[event][t] && this.triggers[event][t](source);
            }
        }

        public addProcedure(name: string, fn: Function): void {
            this.procedures[name] = fn;
        }

        public dropProcedure(name: string): void {
            delete this.procedures[name];
        }

        public callProcedure(name: string): void {
            this.procedures[name] && this.procedures[name]();
        }

        private updateUniqueIndexes(obj: any): void {
            let f: any,
                h: any,
                hash: string;
            for (f in obj) {
                if (!obj.hasOwnProperty(f))
                    continue;
                if (this.indexes.unique[f]) {
                    hash = CasperUtils.getHash(obj[f]);
                    if (this.indexes.unique[f][hash]) {
                        // TODO Should we check the id just in case?
                        continue;
                    }

                    for (h in this.indexes.unique[f]) {
                        if (!this.indexes.unique[f].hasOwnProperty(h))
                            continue;
                        if (this.indexes.unique[f][h] === obj._id) {
                            delete this.indexes.unique[f][h];
                            break;
                        }
                    }
                    this.indexes.unique[f][hash] = obj._id;
                }
            }
        }

        private checkConstraints(obj: any): boolean {
            let field: string,
                hash: string,
                v: number,
                r: RegExp;

            /**
             * Set any default values
             * If there is already a value for the field, it is skipped
             */
            for (field in this.constraints.defaultsTo) {
                if (obj[field] === undefined) {
                    obj[field] = this.constraints.defaultsTo[field];
                }
            }

            /**
             * Check the type of the field
             */
            for (field in this.constraints.type) {
                if (obj[field] !== undefined && obj[field] !== null) {
                    if (typeof obj[field] !== this.constraints.type[field]) {
                        return false;
                    }
                }
            }

            /**
             * Make sure all required fields are present
             */
            for (field of this.constraints.required) {
                if (obj[field] === undefined) {
                    return false;
                }
            }

            /**
             * Check all notNull values
             */
            for (field of this.constraints.notNull) {
                if (obj[field] !== undefined && obj[field] === null) {
                    return false;
                }
            }

            /**
             * Validate unique values
             */
            for (field of this.constraints.unique) {
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? CasperUtils.getHash(obj[field]) : obj[field];
                    if (this.indexes.unique[field][hash] !== undefined && this.indexes.unique[field][hash] !== obj._id) {
                        return false;
                    }
                }
            }

            /**
             * Validate max value
             * For strings this is the length, for numbers it is the actual value
             */
            for (field in this.constraints.min) {
                if (!this.constraints.min.hasOwnProperty(field) || !obj.hasOwnProperty(field))
                    continue;

                v = typeof obj[field] === 'string' ? obj[field].length : obj[field];
                if (v < this.constraints.min[field]) {
                    return false;
                }
            }

            /**
             * Validate max value
             * For strings this is the length, for numbers it is the actual value
             */
            for (field in this.constraints.max) {
                if (!this.constraints.min.hasOwnProperty(field) || !obj.hasOwnProperty(field))
                    continue;
                v = typeof obj[field] === 'string' ? obj[field].length : obj[field];
                if (v > this.constraints.max[field]) {
                    return false;
                }
            }

            /**
             * Validate regex patterns
             */
            for (field in this.constraints.pattern) {
                if (obj[field]) {
                    r = new RegExp(this.constraints.pattern[field]);
                    if (!obj[field].match(r)) {
                        return false;
                    }
                }
            }

            return true;
        }

        private createIndexes(obj: any, idx: number): void {
            let field: string,
                hash: string;

            this.indexes.id[obj._id] = idx;
            for (field of this.constraints.unique) {
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? CasperUtils.getHash(obj[field]) : obj[field];
                    this.indexes.unique[field][hash] = obj._id;
                }
            }
        }

        public save(source: any) {
            let o = (<any>Object).assign({}, source);

            if (!this.checkConstraints(o)) {
                return false;
            }

            if (!o._id || this.indexes.id[o._id] === undefined) {
                this.runTriggers('beforeCreate', o);
                o._id = CasperUtils.getId();
                let idx = this.records.push(o) - 1;
                this.createIndexes(o, idx);
                this.runTriggers('afterCreate', o);
                return o;
            }

            this.runTriggers('beforeUpdate', o);
            this.records[this.indexes.id[o._id]] = o;
            //_createIndexes(o, this.indexes.id[o._id]);
            this.updateUniqueIndexes(o);
            this.runTriggers('afterUpdate', o);
            return o;
        }

        /**
         * Removes a record from the database
         */
        public remove(source: any) {
            if (!source._id) {
                return false;
            }

            this.runTriggers('beforeDelete', source);

            for (var i = 0; i < this.records.length; ++i) {
                if (this.records[i]._id === source._id) {
                    this.records.splice(i, 1);
                    delete this.indexes.id[source._id];
                    for (var f in this.indexes.unique) {
                        for (var u in this.indexes.unique[f]) {
                            if (this.indexes.unique[f][u] === source._id) {
                                delete this.indexes.unique[f][u];
                                break;
                            }
                        }
                    }
                    break;
                }
            }

            this.runTriggers('afterDelete', source);
        }

        public findById(id: string): any {
            if (!this.indexes.id[id]) {
                for (var i = 0; i < this.records.length; ++i) {
                    if (this.records[i]._id === id) {
                        this.indexes.id[id] = i;
                        return this.records[i];
                    }
                }
                return null;
            }

            return this.records[this.indexes.id[id]];
        }

        public find(): ListQuery {
            return ListQuery.from(this.records);
        }

        public findOne(): ListQuery {
            return this.find().limit(1);
        }

        public findAll(): any {
            return this.records;
        }

        public count(): number {
            return this.records.length;
        }
    }
}

