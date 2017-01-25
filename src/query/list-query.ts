/// <reference path="query-builder.ts" />
/// <reference path="query-part.ts" />
/// <reference path="object-matcher.ts" />


namespace casper {
    export class ListQuery {

        private source: any; // the array of records
        private searchSet: any; // the array to be searched in the end
        private query: QueryBuilder;
        private max: number;
        private indexes: any; // the indexes object to be passed from Collection
        private indexedFields: any; // a list of the indexed fields

        private liveQuery: boolean; // if we WHERE, AND, OR an indexed field, query in real-time
        private liveQueryField: string; // the field to use during live querying

        private constructor(source: any) {
            this.source = source;
            this.searchSet = [];
            this.query = new QueryBuilder();
            this.max = 0;
            this.liveQuery = false;
        }

        public static from(source: any): ListQuery {
            return new ListQuery(source);
        }

        public getSource(): any {
            return this.source;
        }

        public reset(): ListQuery {
            this.query.reset();
            this.searchSet = [];
            return this;
        }


        public setQuery(queryBuilder: QueryBuilder): ListQuery {
            this.query = queryBuilder;
            return this;
        }

        public setIndexes(indexes: any) {
            let f: string;
            this.indexedFields = ['_id'];
            this.indexes = indexes;
            if (this.indexes) {
                if (this.indexes.unique) {
                    for (f in this.indexes.unique) {
                        if (!this.indexes.unique.hasOwnProperty(f)) {
                            continue;
                        }

                        if (this.indexedFields.indexOf(f) < 0) {
                            this.indexedFields.push(f);
                        }
                    }
                }

                if (this.indexes.indexed) {
                    for (f in this.indexes.indexed) {
                        if (!this.indexes.indexed.hasOwnProperty(f)) {
                            continue;
                        }

                        if (this.indexedFields.indexOf(f) < 0) {
                            this.indexedFields.push(f);
                        }
                    }
                }
            }
            return this;
        }

        public eq(value: any): ListQuery {
            this.addPart(QueryPart.Command.Eq, value);
            return this;
        }

        public ne(value: any): ListQuery {
            this.addPart(QueryPart.Command.Ne, value);
            return this;
        }


        public lg(value: any): ListQuery {
            this.addPart(QueryPart.Command.Lg, value);
            return this;
        }

        public gt(value: any): ListQuery {
            this.addPart(QueryPart.Command.Gt, value);
            return this;
        }


        public lt(value: any): ListQuery {
            this.addPart(QueryPart.Command.Lt, value);
            return this;
        }


        public le(value: any): ListQuery {
            this.addPart(QueryPart.Command.Le, value);
            return this;
        }


        public in(value: any): ListQuery {
            this.addPart(QueryPart.Command.In, value);
            return this;
        }


        public like(value: any): ListQuery {
            this.addPart(QueryPart.Command.Like, value);
            return this;
        }


        public and(field: string): ListQuery {
            this.liveQuery = false;
            this.addPart(QueryPart.Command.And, field);
            if (this.indexedFields.indexOf(field) > 0) {
                this.liveQuery = true;
                this.liveQueryField = field;
            }
            return this;
        }


        public or(field: string): ListQuery {
            this.liveQuery = false;
            this.addPart(QueryPart.Command.Or, field);
            if (this.indexedFields.indexOf(field) > 0) {
                this.liveQuery = true;
                this.liveQueryField = field;
            }
            return this;
        }

        public where(field: string): ListQuery {
            this.liveQuery = false;
            this.addPart(QueryPart.Command.Where, field);
            if (this.indexedFields.indexOf(field) > 0) {
                this.liveQuery = true;
                this.liveQueryField = field;
            }
            return this;
        }

        public not(): ListQuery {
            this.liveQuery = false;
            this.addPart(QueryPart.Command.Not);
            return this;
        }

        public limit(max: number): ListQuery {
            this.max = max;
            return this;
        }

        public orderBy(field: string, direction: string) {
            switch (direction) {
                case 'desc':
                    break;
                case 'asc':
                    break;
            }
        }

        public exec(): any {
            let results: any = [],
                o: any;

            if (this.searchSet.length === 0) {
                this.searchSet = this.source;
            }

            for (o of this.searchSet) {
                if (this.buildQuery(o).isMatch()) {
                    results.push(o);
                    if (results.length === this.max)
                        break;
                }
            }

            this.query.reset();
            this.searchSet = [];
            return results;
        }

        /**
         * @deprecated use exec()
         * @returns {Array}
         */
        public execute(): any {
            return this.exec();
        }

        private buildQuery(source: any): ObjectMatcher {
            let q = ObjectMatcher.match(source),
                part: QueryPart;
            for (part of this.query.getParts()) {
                switch (part.getCommand()) {
                    case QueryPart.Command.And:
                        q.and(part.getValue());
                        break;
                    case QueryPart.Command.Or:
                        q.or(part.getValue());
                        break;
                    case QueryPart.Command.Not:
                        q.not();
                        break;
                    case QueryPart.Command.Where:
                        q.where(part.getValue());
                        break;
                    case QueryPart.Command.Eq:
                        q.eq(part.getValue());
                        break;
                    case QueryPart.Command.Ne:
                        q.ne(part.getValue());
                        break;
                    case QueryPart.Command.Lt:
                        q.lt(part.getValue());
                        break;
                    case QueryPart.Command.Gt:
                        q.gt(part.getValue());
                        break;
                    case QueryPart.Command.Ge:
                        q.ge(part.getValue());
                        break;
                    case QueryPart.Command.Le:
                        q.le(part.getValue());
                        break;
                    case QueryPart.Command.Lg:
                        q.lg(part.getValue());
                        break;
                    case QueryPart.Command.In:
                        q.in(part.getValue());
                        break;
                    case QueryPart.Command.Between:
                        // TODO handle start and end?
                        break;
                    case QueryPart.Command.Like:
                        q.like(part.getValue());
                        break;
                }
            }

            return q;
        }

        private addPart(command: any, value?: any): void {
            this.query.add(command, value);

            if (this.liveQuery) {
                let hash: string = CasperUtils.getHash(value);
                let ids: any = [], id: string;
                if (this.indexes.unique[this.liveQueryField]) {
                    id = this.indexes.unique[this.liveQueryField][hash];
                    if (id && ids.indexOf(id) < 0) {
                        ids.push(id);
                    }
                }

                if (this.indexes.indexed[this.liveQueryField] && this.indexes.indexed[this.liveQueryField][hash]) {
                    for (id of this.indexes.indexed[this.liveQueryField][hash]) {
                        if (ids.indexOf(id) < 0) {
                            ids.push(id);
                        }
                    }
                }

                for (id of ids) {
                    if (this.indexes.id[id] !== undefined) {
                        this.searchSet.push(this.source[this.indexes.id[id]]);
                    }
                }
            }
        }
    }
}