var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var casper;
(function (casper) {
    var Mode;
    (function (Mode) {
        Mode[Mode["Exact"] = 0] = "Exact";
        Mode[Mode["IgnoreCase"] = 1] = "IgnoreCase";
        Mode[Mode["Regex"] = 2] = "Regex";
        Mode[Mode["LessThan"] = 3] = "LessThan";
        Mode[Mode["GreaterThan"] = 4] = "GreaterThan";
        Mode[Mode["LessThanEqual"] = 5] = "LessThanEqual";
        Mode[Mode["GreaterThanEqual"] = 6] = "GreaterThanEqual";
        Mode[Mode["In"] = 7] = "In";
        Mode[Mode["Between"] = 8] = "Between";
    })(Mode || (Mode = {}));
    var CasperUtils = (function () {
        function CasperUtils() {
        }
        CasperUtils.compare = function (source, field, value, mode) {
            if (mode === void 0) { mode = CasperUtils.Mode.Exact; }
            var o = source[field], v, regex;
            if (o instanceof Number && !(value instanceof Array)) {
                return o < value ? -1 : o > value ? 1 : 0;
            }
            else if (value instanceof Array) {
                for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                    v = value_1[_i];
                    if (o == v) {
                        return 0;
                    }
                }
                return -1;
            }
            else if (typeof o === "string") {
                if (mode === CasperUtils.Mode.IgnoreCase) {
                    return o.toLowerCase() == value.toLowerCase() ? 0 : -1;
                }
                else if (mode === CasperUtils.Mode.Regex) {
                    regex = new RegExp(value);
                    return regex.test(o) ? 0 : -1;
                }
            }
            return o == value ? 0 : -1;
        };
        CasperUtils.getId = function () {
            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', result = '', i;
            for (i = 0; i < 32; ++i)
                result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        };
        CasperUtils.getHash = function (str) {
            var hash = 0, c, i;
            if (str.length === 0) {
                return hash.toString();
            }
            for (i = 0; i < str.length; ++i) {
                c = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash |= 0;
            }
            return hash.toString();
        };
        return CasperUtils;
    }());
    CasperUtils.Mode = Mode;
    casper.CasperUtils = CasperUtils;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var Command;
    (function (Command) {
        Command[Command["And"] = 0] = "And";
        Command[Command["Or"] = 1] = "Or";
        Command[Command["Where"] = 2] = "Where";
        Command[Command["Eq"] = 3] = "Eq";
        Command[Command["Ne"] = 4] = "Ne";
        Command[Command["Lt"] = 5] = "Lt";
        Command[Command["Le"] = 6] = "Le";
        Command[Command["Gt"] = 7] = "Gt";
        Command[Command["Ge"] = 8] = "Ge";
        Command[Command["Lg"] = 9] = "Lg";
        Command[Command["Like"] = 10] = "Like";
        Command[Command["In"] = 11] = "In";
        Command[Command["Between"] = 12] = "Between";
        Command[Command["Not"] = 13] = "Not";
        Command[Command["Limit"] = 14] = "Limit";
    })(Command || (Command = {}));
    var QueryPart = (function () {
        function QueryPart(command, value) {
            this.command = command;
            this.value = value;
        }
        QueryPart.prototype.getCommand = function () {
            return this.command;
        };
        QueryPart.prototype.getValue = function () {
            return this.value;
        };
        return QueryPart;
    }());
    QueryPart.Command = Command;
    casper.QueryPart = QueryPart;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var Type;
    (function (Type) {
        Type[Type["Find"] = 0] = "Find";
        Type[Type["Remove"] = 1] = "Remove";
    })(Type || (Type = {}));
    var QueryBuilder = (function () {
        function QueryBuilder(repository, type) {
            this.repository = repository;
            this.type = type;
            this.parts = [];
        }
        QueryBuilder.prototype.getType = function () {
            return this.type;
        };
        QueryBuilder.prototype.getRepository = function () {
            return this.repository;
        };
        QueryBuilder.prototype.getParts = function () {
            return this.parts;
        };
        QueryBuilder.prototype.reset = function () {
            this.parts = [];
        };
        QueryBuilder.prototype.add = function (command, value) {
            this.parts.push(new casper.QueryPart(command, value));
        };
        return QueryBuilder;
    }());
    QueryBuilder.Type = Type;
    casper.QueryBuilder = QueryBuilder;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var ObjectMatcher = (function () {
        function ObjectMatcher(source) {
            this.result = false;
            this.skipNext = false;
            this.negate = false;
            this.source = source;
            this.sourceClass = null;
            this.field = null;
        }
        ObjectMatcher.match = function (source) {
            return new ObjectMatcher(source);
        };
        ObjectMatcher.prototype.getSource = function () {
            return this.source;
        };
        ObjectMatcher.prototype.getSourceClass = function () {
            return this.sourceClass;
        };
        ObjectMatcher.prototype.getField = function () {
            return this.field;
        };
        ObjectMatcher.prototype.isMatch = function () {
            return this.result;
        };
        ObjectMatcher.prototype.test = function (value, mode) {
            if (this.skipNext) {
                this.skipNext = false;
                this.negate = false;
                return this;
            }
            var result = casper.CasperUtils.compare(this.source, this.field, value, mode);
            if (mode == casper.CasperUtils.Mode.LessThan) {
                this.result = this.negate != (result < 0);
            }
            else if (mode == casper.CasperUtils.Mode.GreaterThan) {
                this.result = this.negate != (result > 0);
            }
            else if (mode == casper.CasperUtils.Mode.LessThanEqual) {
                this.result = this.negate != (result <= 0);
            }
            else if (mode == casper.CasperUtils.Mode.GreaterThanEqual) {
                this.result = this.negate != (result >= 0);
            }
            else {
                this.result = this.negate != (result == 0);
            }
            this.negate = false;
            return this;
        };
        ObjectMatcher.prototype.where = function (field) {
            this.field = field;
            return this;
        };
        ;
        ObjectMatcher.prototype.and = function (field) {
            this.field = field;
            this.skipNext = !this.result;
            return this;
        };
        ;
        ObjectMatcher.prototype.or = function (field) {
            this.field = field;
            this.skipNext = this.result;
            return this;
        };
        ObjectMatcher.prototype.not = function () {
            this.negate = true;
            return this;
        };
        ObjectMatcher.prototype.eq = function (value) {
            return this.test(value, casper.CasperUtils.Mode.Exact);
        };
        ObjectMatcher.prototype.ne = function (value) {
            this.negate = true;
            return this.eq(value);
        };
        ObjectMatcher.prototype.lg = function (value) {
            return this.ne(value);
        };
        ObjectMatcher.prototype.lt = function (value) {
            return this.test(value, casper.CasperUtils.Mode.LessThan);
        };
        ObjectMatcher.prototype.gt = function (value) {
            return this.test(value, casper.CasperUtils.Mode.GreaterThan);
        };
        ObjectMatcher.prototype.le = function (value) {
            return this.test(value, casper.CasperUtils.Mode.LessThanEqual);
        };
        ObjectMatcher.prototype.ge = function (value) {
            return this.test(value, casper.CasperUtils.Mode.GreaterThanEqual);
        };
        ObjectMatcher.prototype.like = function (value) {
            value = value.replace(/\\%/g, '$$$$__PERCENT__$$$$');
            value = value.replace(/%/g, '%$$$$__WILDCARD__$$$$%');
            var parts = value.split('%');
            var sb = '';
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
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
            return this.test(sb, casper.CasperUtils.Mode.Regex);
        };
        ObjectMatcher.prototype["in"] = function (values) {
            return this.test(values, casper.CasperUtils.Mode.In);
        };
        ObjectMatcher.prototype.between = function (start, end) {
            var s, e, i;
            if (this.skipNext) {
                this.skipNext = false;
                this.negate = false;
                return this;
            }
            if (start > end) {
                s = end;
                e = start;
            }
            else if (start < end) {
                s = start;
                e = end;
            }
            else {
                return this.test(start, casper.CasperUtils.Mode.Exact);
            }
            for (i = s; i <= e; ++i) {
                if (casper.CasperUtils.compare(this.source, this.field, i, casper.CasperUtils.Mode.Between) == 0) {
                    this.result = !this.negate;
                    this.negate = false;
                    return this;
                }
            }
            this.result = this.negate;
            this.negate = false;
            return this;
        };
        return ObjectMatcher;
    }());
    casper.ObjectMatcher = ObjectMatcher;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var ListQuery = (function () {
        function ListQuery(source) {
            this.source = source;
            this.searchSet = [];
            this.query = new casper.QueryBuilder();
            this.max = 0;
            this.indexedFields = [];
            this.liveQuery = false;
        }
        ListQuery.from = function (source) {
            return new ListQuery(source);
        };
        ListQuery.prototype.getSource = function () {
            return this.source;
        };
        ListQuery.prototype.reset = function () {
            this.query.reset();
            this.searchSet = [];
            return this;
        };
        ListQuery.prototype.setQuery = function (queryBuilder) {
            this.query = queryBuilder;
            return this;
        };
        ListQuery.prototype.setIndexes = function (indexes) {
            var f;
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
        };
        ListQuery.prototype.eq = function (value) {
            this.addPart(casper.QueryPart.Command.Eq, value);
            return this;
        };
        ListQuery.prototype.ne = function (value) {
            this.addPart(casper.QueryPart.Command.Ne, value);
            return this;
        };
        ListQuery.prototype.lg = function (value) {
            this.addPart(casper.QueryPart.Command.Lg, value);
            return this;
        };
        ListQuery.prototype.gt = function (value) {
            this.addPart(casper.QueryPart.Command.Gt, value);
            return this;
        };
        ListQuery.prototype.lt = function (value) {
            this.addPart(casper.QueryPart.Command.Lt, value);
            return this;
        };
        ListQuery.prototype.le = function (value) {
            this.addPart(casper.QueryPart.Command.Le, value);
            return this;
        };
        ListQuery.prototype["in"] = function (value) {
            this.addPart(casper.QueryPart.Command.In, value);
            return this;
        };
        ListQuery.prototype.like = function (value) {
            this.addPart(casper.QueryPart.Command.Like, value);
            return this;
        };
        ListQuery.prototype.and = function (field) {
            this.liveQuery = false;
            this.addPart(casper.QueryPart.Command.And, field);
            if (this.indexedFields.indexOf(field) > 0) {
                this.liveQuery = true;
                this.liveQueryField = field;
            }
            return this;
        };
        ListQuery.prototype.or = function (field) {
            this.liveQuery = false;
            this.addPart(casper.QueryPart.Command.Or, field);
            if (this.indexedFields.indexOf(field) > 0) {
                this.liveQuery = true;
                this.liveQueryField = field;
            }
            return this;
        };
        ListQuery.prototype.where = function (field) {
            this.liveQuery = false;
            this.addPart(casper.QueryPart.Command.Where, field);
            if (this.indexedFields.indexOf(field) > 0) {
                this.liveQuery = true;
                this.liveQueryField = field;
            }
            return this;
        };
        ListQuery.prototype.not = function () {
            this.liveQuery = false;
            this.addPart(casper.QueryPart.Command.Not);
            return this;
        };
        ListQuery.prototype.limit = function (max) {
            this.max = max;
            return this;
        };
        ListQuery.prototype.orderBy = function (field, direction) {
            switch (direction) {
                case 'desc':
                    break;
                case 'asc':
                    break;
            }
        };
        ListQuery.prototype.exec = function () {
            var results = [], o;
            if (this.searchSet.length === 0) {
                this.searchSet = this.source;
            }
            for (var _i = 0, _a = this.searchSet; _i < _a.length; _i++) {
                o = _a[_i];
                if (this.buildQuery(o).isMatch()) {
                    results.push(o);
                    if (results.length === this.max)
                        break;
                }
            }
            this.query.reset();
            this.searchSet = [];
            return results;
        };
        ListQuery.prototype.execute = function () {
            return this.exec();
        };
        ListQuery.prototype.buildQuery = function (source) {
            var q = casper.ObjectMatcher.match(source), part;
            for (var _i = 0, _a = this.query.getParts(); _i < _a.length; _i++) {
                part = _a[_i];
                switch (part.getCommand()) {
                    case casper.QueryPart.Command.And:
                        q.and(part.getValue());
                        break;
                    case casper.QueryPart.Command.Or:
                        q.or(part.getValue());
                        break;
                    case casper.QueryPart.Command.Not:
                        q.not();
                        break;
                    case casper.QueryPart.Command.Where:
                        q.where(part.getValue());
                        break;
                    case casper.QueryPart.Command.Eq:
                        q.eq(part.getValue());
                        break;
                    case casper.QueryPart.Command.Ne:
                        q.ne(part.getValue());
                        break;
                    case casper.QueryPart.Command.Lt:
                        q.lt(part.getValue());
                        break;
                    case casper.QueryPart.Command.Gt:
                        q.gt(part.getValue());
                        break;
                    case casper.QueryPart.Command.Ge:
                        q.ge(part.getValue());
                        break;
                    case casper.QueryPart.Command.Le:
                        q.le(part.getValue());
                        break;
                    case casper.QueryPart.Command.Lg:
                        q.lg(part.getValue());
                        break;
                    case casper.QueryPart.Command.In:
                        q["in"](part.getValue());
                        break;
                    case casper.QueryPart.Command.Between:
                        break;
                    case casper.QueryPart.Command.Like:
                        q.like(part.getValue());
                        break;
                }
            }
            return q;
        };
        ListQuery.prototype.addPart = function (command, value) {
            this.query.add(command, value);
            if (this.liveQuery) {
                var hash = casper.CasperUtils.getHash(value);
                var ids = [], id = void 0;
                if (this.indexes.unique[this.liveQueryField]) {
                    id = this.indexes.unique[this.liveQueryField][hash];
                    if (id && ids.indexOf(id) < 0) {
                        ids.push(id);
                    }
                }
                if (this.indexes.indexed[this.liveQueryField] && this.indexes.indexed[this.liveQueryField][hash]) {
                    for (var _i = 0, _a = this.indexes.indexed[this.liveQueryField][hash]; _i < _a.length; _i++) {
                        id = _a[_i];
                        if (ids.indexOf(id) < 0) {
                            ids.push(id);
                        }
                    }
                }
                for (var _b = 0, ids_1 = ids; _b < ids_1.length; _b++) {
                    id = ids_1[_b];
                    if (this.indexes.id[id] !== undefined) {
                        this.searchSet.push(this.source[this.indexes.id[id]]);
                    }
                }
            }
        };
        return ListQuery;
    }());
    casper.ListQuery = ListQuery;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var Collection = (function () {
        function Collection(options) {
            this.records = [];
            this.initIndexes();
            this.initConstraints();
            this.initTriggers();
            this.initProcedures();
            if (options) {
                if (options.constraints) {
                    for (var c in options.constraints) {
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
        Collection.prototype.initIndexes = function () {
            this.indexes = { id: {}, unique: {}, indexed: {} };
        };
        Collection.prototype.initConstraints = function () {
            this.constraints = {
                unique: [],
                indexed: [],
                required: [],
                notNull: [],
                min: {},
                max: {},
                defaultsTo: {},
                pattern: {},
                type: {}
            };
        };
        Collection.prototype.initTriggers = function () {
            this.triggers = {
                beforeCreate: {},
                afterCreate: {},
                beforeUpdate: {},
                afterUpdate: {},
                beforeDelete: {},
                afterDelete: {}
            };
        };
        Collection.prototype.initProcedures = function () {
            this.procedures = {};
        };
        Collection.prototype.getIndexes = function () {
            return this.indexes;
        };
        Collection.prototype.getConstraints = function () {
            return this.constraints;
        };
        Collection.prototype.rebuildIndexes = function () {
            var hash, u, i;
            this.initIndexes();
            for (i = 0; i < this.records.length; ++i) {
                this.indexes.id[this.records[i]._id] = i;
                for (var _i = 0, _a = this.constraints.unique; _i < _a.length; _i++) {
                    u = _a[_i];
                    this.indexes.unique[u] = {};
                    if (this.records[i][u]) {
                        hash = typeof this.records[i][u] === 'string' ? casper.CasperUtils.getHash(this.records[i][u]) : this.records[i][u];
                        this.indexes.unique[u][hash] = this.records[i]._id;
                    }
                }
            }
        };
        ;
        Collection.prototype.addConstraint = function (field, constraint) {
            if (constraint.unique) {
                if (this.constraints.unique.indexOf(field) < 0) {
                    this.constraints.unique.push(field);
                    this.indexes.unique[field] = {};
                }
            }
            if (constraint.indexed) {
                if (this.constraints.indexed.indexOf(field) < 0) {
                    this.constraints.indexed.push(field);
                    this.indexes.indexed[field] = {};
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
        };
        Collection.prototype.addTrigger = function (event, name, fn) {
            this.triggers[event][name] = fn;
        };
        Collection.prototype.dropTrigger = function (event, name) {
            delete this.triggers[event][name];
        };
        Collection.prototype.runTriggers = function (event, source) {
            if (this.triggers[event] === undefined)
                return;
            for (var t in this.triggers[event]) {
                this.triggers[event][t] && this.triggers[event][t](source);
            }
        };
        Collection.prototype.addProcedure = function (name, fn) {
            this.procedures[name] = fn;
        };
        Collection.prototype.dropProcedure = function (name) {
            delete this.procedures[name];
        };
        Collection.prototype.callProcedure = function (name) {
            this.procedures[name] && this.procedures[name]();
        };
        Collection.prototype.updateUniqueIndexes = function (obj) {
            var f, h, hash;
            for (f in obj) {
                if (!obj.hasOwnProperty(f))
                    continue;
                if (this.indexes.unique[f]) {
                    hash = casper.CasperUtils.getHash(obj[f]);
                    if (this.indexes.unique[f][hash]) {
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
        };
        Collection.prototype.updateIndexedIndexes = function (obj) {
            var f, h, hash, idx;
            for (f in obj) {
                if (!obj.hasOwnProperty(f)) {
                    continue;
                }
                if (this.indexes.indexed[f]) {
                    hash = casper.CasperUtils.getHash(obj[f]);
                    if (this.indexes.indexed[f][hash]) {
                        if (this.indexes.indexed[f][hash].indexOf(obj._id) > -1) {
                            continue;
                        }
                    }
                    for (h in this.indexes.indexed[f]) {
                        if (!this.indexes.indexed[f].hasOwnProperty(h)) {
                            continue;
                        }
                        idx = this.indexes.indexed[f][h].indexOf(obj._id);
                        if (idx > -1) {
                            this.indexes.indexed[f][h].splice(idx, 1);
                            if (this.indexes.indexed[f][h].length === 0) {
                                delete this.indexes.indexed[f][h];
                            }
                            break;
                        }
                    }
                    if (!this.indexes.indexed[f][hash]) {
                        this.indexes.indexed[f][hash] = [];
                    }
                    this.indexes.indexed[f][hash].push(obj._id);
                }
            }
        };
        Collection.prototype.checkConstraints = function (obj) {
            var field, hash, v, r;
            for (field in this.constraints.defaultsTo) {
                if (obj[field] === undefined) {
                    obj[field] = this.constraints.defaultsTo[field];
                }
            }
            for (field in this.constraints.type) {
                if (obj[field] !== undefined && obj[field] !== null) {
                    if (typeof obj[field] !== this.constraints.type[field]) {
                        return false;
                    }
                }
            }
            for (var _i = 0, _a = this.constraints.required; _i < _a.length; _i++) {
                field = _a[_i];
                if (obj[field] === undefined) {
                    return false;
                }
            }
            for (var _b = 0, _c = this.constraints.notNull; _b < _c.length; _b++) {
                field = _c[_b];
                if (obj[field] !== undefined && obj[field] === null) {
                    return false;
                }
            }
            for (var _d = 0, _e = this.constraints.unique; _d < _e.length; _d++) {
                field = _e[_d];
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? casper.CasperUtils.getHash(obj[field]) : obj[field];
                    if (this.indexes.unique[field][hash] !== undefined && this.indexes.unique[field][hash] !== obj._id) {
                        return false;
                    }
                }
            }
            for (field in this.constraints.min) {
                if (!this.constraints.min.hasOwnProperty(field) || !obj.hasOwnProperty(field))
                    continue;
                v = typeof obj[field] === 'string' ? obj[field].length : obj[field];
                if (v < this.constraints.min[field]) {
                    return false;
                }
            }
            for (field in this.constraints.max) {
                if (!this.constraints.min.hasOwnProperty(field) || !obj.hasOwnProperty(field))
                    continue;
                v = typeof obj[field] === 'string' ? obj[field].length : obj[field];
                if (v > this.constraints.max[field]) {
                    return false;
                }
            }
            for (field in this.constraints.pattern) {
                if (obj[field]) {
                    r = new RegExp(this.constraints.pattern[field]);
                    if (!obj[field].match(r)) {
                        return false;
                    }
                }
            }
            return true;
        };
        Collection.prototype.createIndexes = function (obj, idx) {
            var field, hash;
            this.indexes.id[obj._id] = idx;
            for (var _i = 0, _a = this.constraints.unique; _i < _a.length; _i++) {
                field = _a[_i];
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? casper.CasperUtils.getHash(obj[field]) : obj[field].toString();
                    this.indexes.unique[field][hash] = obj._id;
                }
            }
            for (var _b = 0, _c = this.constraints.indexed; _b < _c.length; _b++) {
                field = _c[_b];
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? casper.CasperUtils.getHash(obj[field]) : obj[field].toString();
                    if (this.indexes.indexed[field][hash] === undefined)
                        this.indexes.indexed[field][hash] = [];
                    this.indexes.indexed[field][hash].push(obj._id);
                }
            }
        };
        Collection.prototype.save = function (source) {
            var o = Object.assign({}, source);
            if (!this.checkConstraints(o)) {
                return false;
            }
            if (!o._id || this.indexes.id[o._id] === undefined) {
                this.runTriggers('beforeCreate', o);
                o._id = casper.CasperUtils.getId();
                var idx = this.records.push(o) - 1;
                this.createIndexes(o, idx);
                this.runTriggers('afterCreate', o);
                return o;
            }
            this.runTriggers('beforeUpdate', o);
            this.records[this.indexes.id[o._id]] = o;
            this.updateUniqueIndexes(o);
            this.updateIndexedIndexes(o);
            this.runTriggers('afterUpdate', o);
            return o;
        };
        Collection.prototype.remove = function (source) {
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
        };
        Collection.prototype.findById = function (id) {
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
        };
        Collection.prototype.find = function () {
            return casper.ListQuery.from(this.records).setIndexes(this.indexes);
        };
        Collection.prototype.findOne = function () {
            return this.find().limit(1);
        };
        Collection.prototype.findAll = function () {
            return this.records;
        };
        Collection.prototype.count = function () {
            return this.records.length;
        };
        return Collection;
    }());
    casper.Collection = Collection;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var Database = (function () {
        function Database() {
            this.database = {};
        }
        Database.prototype.createCollection = function (name, options) {
            if (!this.database[name] && !this[name]) {
                this.database[name] = new casper.Collection(options);
                this[name] = this.database[name];
            }
        };
        Database.prototype.getCollection = function (name) {
            return this.database[name];
        };
        Database.prototype.dropCollection = function (name) {
            if (this.database[name])
                delete this.database[name];
        };
        return Database;
    }());
    casper.Database = Database;
})(casper || (casper = {}));
var casper;
(function (casper) {
    var Exception = (function (_super) {
        __extends(Exception, _super);
        function Exception(message) {
            var _this = _super.call(this, message) || this;
            _this.name = 'Exception';
            _this.message = message;
            _this.stack = new Error().stack;
            return _this;
        }
        Exception.prototype.getMessage = function () {
            return this.message;
        };
        return Exception;
    }(Error));
    casper.Exception = Exception;
})(casper || (casper = {}));
//# sourceMappingURL=casper.js.map