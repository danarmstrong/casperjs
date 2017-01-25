/// <reference path="query-builder.ts" />
/// <reference path="query-part.ts" />
/// <reference path="object-matcher.ts" />


namespace casper {
    export class ListQuery {

        private source: any;
        private query: QueryBuilder;
        private max: number;

        private constructor(source: any) {
            this.source = source;
            this.query = new QueryBuilder();
            this.max = 0;
        }

        public static from(source: any): ListQuery {
            return new ListQuery(source);
        }

        public getSource(): any {
            return this.source;
        }

        public reset(): ListQuery {
            this.query.reset();
            return this;
        }


        public setQuery(queryBuilder: QueryBuilder): ListQuery {
            this.query = queryBuilder;
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
            this.addPart(QueryPart.Command.And, field);
            return this;
        }


        public or(field: string): ListQuery {
            this.addPart(QueryPart.Command.Or, field);
            return this;
        }

        public not(): ListQuery {
            this.addPart(QueryPart.Command.Not);
            return this;
        }

        public where(field: string): ListQuery {
            this.addPart(QueryPart.Command.Where, field);
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
                p: any;
            for (p in this.source) {
                if (!this.source.hasOwnProperty(p))
                    continue;

                if (this.buildQuery(p).isMatch()) {
                    results.push(p);
                    if (results.length === this.max)
                        break;
                }
            }

            this.query.reset();
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
        }
    }
}