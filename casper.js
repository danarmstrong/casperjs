/**
 * JavaScript port of CasperDB
 * This port includes everything (plus some) from the Java version
 * except for the Java/Spring specific features such as repositories
 * and method interception.
 * --
 * I am planning to backport the new features from this to the Java
 * build.
 */
var casper = casper || {};

casper = (function () {
    var CasperUtils = {
        Mode: {
            Exact: 0,
            IgnoreCase: 1,
            Regex: 2,
            LessThan: 3,
            GreaterThan: 4,
            LessThanEqual: 5,
            GreaterThanEqual: 6,
            In: 7,
            Between: 8
        },

        compare: function (t, field, value, mode) {
            var o = t[field];

            if (!mode)
                mode = CasperUtils.Mode.Exact;

            if (o instanceof Number && !(value instanceof Array)) {
                return o < value ? -1 : o > value ? 1 : 0;
            } else if (value instanceof Array) {
                for (v of value) {
                    if (o == v)
                        return 0;
                }

                return -1;
            } else if (typeof o === "string") {
                if (mode === CasperUtils.Mode.IgnoreCase) {
                    return o.toLowerCase() == value.toLowerCase() ? 0 : -1;
                } else if (mode === CasperUtils.Mode.Regex) {
                    var regex = new RegExp(value);
                    return regex.test(o) ? 0 : -1;
                }
            }

            return o == value ? 0 : -1;
        },

        getId: function () {
            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var result = '';
            for (var i = 0; i < 32; ++i)
                result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        },

        getHash: function (str) {
            var hash = 0, c;

            if (str.length === 0) {
                return hash;
            }

            for (var i = 0; i < str.length; ++i) {
                c = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash |= 0;
            }
            return hash;
        }

    };

    /**
     * ObjectMatcher class
     */
    var ObjectMatcher = (function () {
        function _ObjectMatcher() {
        }

        var ObjectMatcher = function (obj) {
            var _self = this;
            this.result = false;
            this.skipNext = false;
            this.negate = false;
            this.source = obj;
            this.sourceClass = null;
            this.field = null;

            this.getSource = function () {
                return _self.source;
            };

            this.getSourceClass = function () {
                return _self.sourceClass;
            };

            this.getField = function () {
                return _self.field;
            };

            this.isMatch = function () {
                return _self.result;
            };

            function _test(field, value, mode) {
                if (_self.skipNext) {
                    _self.skipNext = false;
                    _self.negate = false;
                    return _self;
                }

                var result = CasperUtils.compare(_self.source, field, value, mode);

                if (mode == CasperUtils.Mode.LessThan) {
                    _self.result = _self.negate != (result < 0);
                } else if (mode == CasperUtils.Mode.GreaterThan) {
                    _self.result = _self.negate != (result > 0);
                } else if (mode == CasperUtils.Mode.LessThanEqual) {
                    _self.result = _self.negate != (result <= 0);
                } else if (mode == CasperUtils.Mode.GreaterThanEqual) {
                    _self.result = _self.negate != (result >= 0);
                } else {
                    _self.result = _self.negate != (result == 0);
                }

                _self.negate = false;
                return _self;
            }

            this.where = function (field) {
                if (!!field)
                    _self.field = field;
                return _self;
            };

            this.and = function (field) {
                if (!!field)
                    _self.field = field;

                _self.skipNext = !_self.result;
                return _self;
            };

            this.or = function (field) {
                if (!!field)
                    _self.field = field;

                _self.skipNext = _self.result;
                return _self;
            }

            this.not = function () {
                _self.negate = true;
                return _self;
            }

            this.eq = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }

                return _test(field, value, CasperUtils.Mode.Exact);
            };

            this.ne = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }
                _self.negate = true;
                return _self.eq(field, value);
            };

            this.lg = function (field, value) {
                return _self.ne(field, value);
            };

            this.lt = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }

                return _test(field, value, CasperUtils.Mode.LessThan);
            };

            this.gt = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }

                return _test(field, value, CasperUtils.Mode.GreaterThan);
            };

            this.le = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }

                return _test(field, value, CasperUtils.Mode.LessThanEquals);
            };

            this.ge = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }

                return _test(field, value, CasperUtils.Mode.GreaterThanEquals);
            };

            this.like = function (field, value) {
                if (!value) {
                    value = field;
                    field = _self.field;
                }

                value = value.replace(/\\%/g, '$$$$__PERCENT__$$$$');
                value = value.replace(/%/g, '%$$$$__WILDCARD__$$$$%');
                var parts = value.split('%');

                var sb = '';
                for (var part of parts) {
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

                return _test(field, sb, CasperUtils.Mode.Regex);
            };

            this.in = function (field, values) {
                if (!values) {
                    values = field;
                    field = _self.field;
                }

                return _test(field, values, CasperUtils.Mode.In);
            };

            this.between = function (field, start, end) {
                if (!end) {
                    end = start;
                    start = field;
                    field = _self.field;
                }

                if (_self.skipNext) {
                    _self.skipNext = false;
                    _self.negate = false;
                    return _self;
                }

                var s, e;
                if (start > end) {
                    s = end;
                    e = start;
                } else if (start < end) {
                    s = start;
                    e = end;
                } else {
                    return _test(field, start, CasperUtils.Mode.Exact);
                }

                for (var i = s; i <= e; ++i) {
                    if (CasperUtils.compare(_self.source, field, i, CasperUtils.Mode.Between) == 0) {
                        _self.result = !_self.negate;
                        _self.negate = false;
                        return _self;
                    }
                }

                _self.result = _self.negate;
                _self.negate = false;
                return _self;
            };
        };

        ObjectMatcher.prototype = _ObjectMatcher.prototype;

        _ObjectMatcher.match = function (obj) {
            return new ObjectMatcher(obj);
        };

        return _ObjectMatcher;

    }());

    /**
     * QueryPart class
     */
    var QueryPart = function (command, field, value) {
        var _self = this;
        var _command = command;
        var _field = field;
        var _value = value;

        this.getCommand = function () {
            return _command;
        };

        this.getField = function () {
            return _field;
        };

        this.getValue = function () {
            return _value;
        };
    };

    QueryPart.Command = {
        And: 0,
        AndField: 1,
        Or: 2,
        OrField: 3,
        Where: 4,
        WhereField: 5,
        Eq: 6,
        EqField: 7,
        Ne: 8,
        NeField: 9,
        Lt: 10,
        LtField: 11,
        Le: 12,
        LeField: 13,
        Gt: 14,
        GtField: 15,
        Ge: 16,
        GeField: 17,
        Lg: 18,
        LgField: 19,
        Like: 20,
        LikeField: 21,
        In: 22,
        InField: 23,
        Between: 24,
        BetweenField: 25,
        Not: 26,
        Limit: 27
    };

    /**
     * QueryBuilder class
     */
    var QueryBuilder = function (repository, type) {
        var _self = this,
            _type = type,
            _repository = repository,
            _parts = [];

        this.getType = function () {
            return _type;
        };

        this.getRepository = function () {
            return _repository;
        };

        this.getParts = function () {
            return _parts;
        };

        this.reset = function () {
            _parts = [];
        };

        this.add = function (command, field, value) {
            _parts.push(new QueryPart(command, field, value));
        };
    };

    QueryBuilder.Type = {
        Find: 0,
        Remove: 0
    };

    /**
     * ListQuery class
     */
    var ListQuery = (function () {
        function _ListQuery() {

        }

        var ListQuery = function (source) {
            var _self = this,
                _source = source,
                _query = new QueryBuilder(),
                _max = 0;

            this.getSource = function () {
                return _source;
            };

            this.reset = function () {
                _query.reset();
                return _self;
            };

            this.setQuery = function (queryBuilder) {
                _query = queryBuilder;
                return _self;
            };

            this.eq = function (field, value) {
                _addPart(QueryPart.Command.Eq, QueryPart.Command.EqField, field, value);
                return _self;
            };

            this.ne = function (field, value) {
                _addPart(QueryPart.Command.Ne, QueryPart.Command.NeField, field, value);
                return _self;
            };

            this.lg = function (field, value) {
                _addPart(QueryPart.Command.Lg, QueryPart.Command.LgField, field, value);
                return _self;
            };

            this.gt = function (field, value) {
                _addPart(QueryPart.Command.Gt, QueryPart.Command.GtField, field, value);
                return _self;
            };

            this.lt = function (field, value) {
                _addPart(QueryPart.Command.Lt, QueryPart.Command.LtField, field, value);
                return _self;
            };

            this.le = function (field, value) {
                _addPart(QueryPart.Command.Le, QueryPart.Command.LeField, field, value);
                return _self;
            };

            this.in = function (field, value) {
                _addPart(QueryPart.Command.In, QueryPart.Command.InField, field, value);
                return _self;
            };

            this.like = function (field, value) {
                _addPart(QueryPart.Command.Like, QueryPart.Command.LikeField, field, value);
                return _self;
            };

            this.and = function (field) {
                _addPart(QueryPart.Command.And, QueryPart.Command.AndField, field, field);
                return _self;
            };

            this.or = function (field) {
                _addPart(QueryPart.Command.Or, QueryPart.Command.OrField, field, field);
                return _self;
            };

            this.not = function () {
                _query.add(QueryPart.Command.Not);
                return _self;
            };

            this.where = function (field) {
                _addPart(QueryPart.Command.Where, QueryPart.Command.WhereField, field, field);
                return _self;
            };

            this.limit = function (max) {
                _max = max;
                return _self;
            };

            this.execute = function () {
                var results = [];
                for (x in _source) {
                    if (_buildQuery(x).isMatch()) {
                        results.push(x);
                        if (results.length === _max)
                            break;
                    }
                }

                _query.reset();
                return results;
            };

            function _buildQuery(x) {
                var q = ObjectMatcher.match(x);
                for (part of _query.getParts()) {
                    switch (part.getCommand()) {
                        case QueryPart.Command.And:
                            q.and();
                            break;
                        case QueryPart.Command.AndField:
                            q.and(part.getField());
                            break;
                        case QueryPart.Command.Or:
                            q.or();
                            break;
                        case QueryPart.Command.OrField:
                            q.or(part.getField());
                            break;
                        case QueryPart.Command.Not:
                            q.not();
                            break;
                        case QueryPart.Command.Where:
                            q.where();
                            break;
                        case QueryPart.Command.WhereField:
                            q.where(part.getField());
                            break;
                        case QueryPart.Command.Eq:
                            q.eq(part.getValue());
                            break;
                        case QueryPart.Command.EqField:
                            q.eq(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Ne:
                            q.ne(part.getValue());
                            break;
                        case QueryPart.Command.NeField:
                            q.eq(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Lt:
                            q.lt(part.getValue());
                            break;
                        case QueryPart.Command.LtField:
                            q.lt(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Gt:
                            q.gt(part.getValue());
                            break;
                        case QueryPart.Command.GtField:
                            q.gt(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Ge:
                            q.ge(part.getValue());
                            break;
                        case QueryPart.Command.GeField:
                            q.ge(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Le:
                            q.le(part.getValue());
                            break;
                        case QueryPart.Command.LeField:
                            q.le(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Lg:
                            q.lg(part.getValue());
                            break;
                        case QueryPart.Command.LgField:
                            q.lg(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.In:
                            q.in(part.getValue());
                            break;
                        case QueryPart.Command.InField:
                            q.in(part.getField(), part.getValue());
                            break;
                        case QueryPart.Command.Between:
                            // TODO handle start and end?
                            break;
                        case QueryPart.Command.BetweenField:
                            // TODO handle start and end?
                            break;
                        case QueryPart.Command.Like:
                            q.like(part.getValue());
                            break;
                        case QueryPart.Command.LikeField:
                            q.like(part.getField(), part.getValue());
                            break;
                    }
                }

                return q;
            }

            function _addPart(command, fieldCommand, field, value) {
                var c = fieldCommand;
                if (!value) {
                    c = command;
                    value = field;
                    field = null;
                }

                _query.add(c, field, value);
            }
        };

        ListQuery.prototype = _ListQuery.prototype;

        _ListQuery.from = function (source) {
            return new ListQuery(source);
        };

        return _ListQuery;

    }());

    /**
     * CasperCollection class
     */
    var CasperCollection = function (options) {
        var _self = this,
            _records = [],
            _indexes = {
                id: {},
                unique: {}
            },
            _constraints = {
                unique: [],
                required: [],
                notNull: [],
                min: {},
                max: {},
                defaultsTo: {},
                pattern: {},
                type: {}
            },
            _triggers = {
                beforeCreate: {},
                afterCreate: {},
                beforeUpdate: {},
                afterUpdate: {},
                beforeDelete: {},
                afterDelete: {}
            },
            _procedures = {};

        if (options) {
            if (options.constraints) {
                for (var c in options.constraints) {
                    if (!options.constraints.hasOwnProperty(c))
                        continue;
                    _addConstraint(c, options.constraints[c]);
                }
            }

            if (options.triggers) {
                if (options.triggers.beforeCreate)
                    _triggers.beforeCreate = options.triggers.beforeCreate;
                if (options.triggers.afterCreate)
                    _triggers.afterCreate = options.triggers.afterCreate;
                if (options.triggers.beforeUpdate)
                    _triggers.beforeUpdate = options.triggers.beforeUpdate;
                if (options.triggers.afterUpdate)
                    _triggers.afterUpdate = options.triggers.afterUpdate;
                if (options.triggers.beforeDelete)
                    _triggers.beforeDelete = options.triggers.beforeDelete;
                if (options.triggers.afterDelete)
                    _triggers.afterDelete = options.triggers.afterDelete;
            }

            if (options.procedures) {
                _procedures = options.procedures;
            }
        }

        this.getIndexes = function () {
            return _indexes;
        };

        this.getConstraints = function () {
            return _constraints;
        };

        this.rebuildIndexes = function () {
            _indexes = {id: {}, unique: {}};
            var hash, u;
            for (var i = 0; i < _records.length; ++i) {
                _indexes.id[_records[i]._id] = i;
                for (u of _constraints.unique) {
                    _indexes.unique[u] = {};
                    if (_records[i][u]) {
                        hash = typeof _records[i][u] === 'string' ? CasperUtils.getHash(_records[i][u]) : _records[i][u];
                        _indexes.unique[u][hash] = _records[i]._id;
                    }
                }
            }
        };

        /**
         * Adds a constraint definition to the collection.
         * This method is local/private so that it is accessible to
         * the constructor.
         */
        function _addConstraint(field, constraint) {
            if (constraint.unique) {
                if (_constraints.unique.indexOf(field) < 0) {
                    _constraints.unique.push(field);
                    _indexes.unique[field] = {};
                }
            }

            if (constraint.required) {
                if (_constraints.required.indexOf(field) < 0) {
                    _constraints.required.push(field);
                }
            }

            if (constraint.notNull) {
                if (_constraints.notNull.indexOf(field) < 0) {
                    _constraints.notNull.push(field);
                }
            }

            if (constraint.min) {
                _constraints.min[field] = constraint.min;
            }

            if (constraint.max) {
                _constraints.max[field] = constraint.max;
            }

            if (constraint.defaultsTo) {
                _constraints.defaultsTo[field] = constraint.defaultsTo;
            }

            if (constraint.pattern) {
                _constraints.pattern[field] = constraint.pattern;
            }

            if (constraint.type) {
                _constraints.type[field] = constraint.type;
            }
        }

        function _addTrigger(event, name, fn) {
            _triggers[event][name] = fn;
        }

        function _dropTrigger(event, name) {
            delete _triggers[event][name];
        }

        function _runTriggers(event, obj) {
            if (_triggers[event] === undefined)
                return false;
            for (var t in _triggers[event]) {
                _triggers[event][t] && _triggers[event][t](obj);
            }
        }

        function _addProcedure(name, fn) {
            _procedures[name] = fn;
        }

        function _dropProcedure(name) {
            delete _procedures[name];
        }

        function _callProcedure(name) {
            _procedures[name] && _procedures[name]();
        }

        /**
         * Exposes _addConstraint publically
         */
        this.addConstraint = function (field, constraint) {
            _addConstraint(field, constraint);
        };

        this.addTrigger = function (event, name, fn) {
            _addTrigger(event, name, fn);
        };

        this.dropTrigger = function (event, name) {
            _dropTrigger(event, name);
        };

        this.addProcedure = function (name, fn) {
            _addProcedure(name, fn);
        };

        this.dropProcedure = function (name) {
            _dropProcedure(name);
        };

        this.callProcedure = function (name) {
            _callProcedure(name);
        };

        /**
         * When we update a record, we need to update
         * any unique indexes accordingly.
         */
        function _updateUniqueIndexes(obj) {
            var f, h, hash;
            for (f in obj) {
                if (!obj.hasOwnProperty(f))
                    continue;
                if (_indexes.unique[f]) {
                    hash = CasperUtils.getHash(obj[f]);
                    if (_indexes.unique[f][hash]) {
                        // TODO Should we check the id just in case?
                        continue;
                    }

                    for (h in _indexes.unique[f]) {
                        if (!_indexes.unique[f].hasOwnProperty(h))
                            continue;
                        if (_indexes.unique[f][h] === obj._id) {
                            delete _indexes.unique[f][h];
                            break;
                        }
                    }
                    _indexes.unique[f][hash] = obj._id;
                }
            }
        }

        /**
         * This method is called when a record is saved.
         * This will validate the record against all of the
         * defined constraints.
         */
        function _checkConstraints(obj) {
            var field, hash, v, r;

            /**
             * Set any default values
             * If there is already a value for the field, it is skipped
             */
            for (field in _constraints.defaultsTo) {
                if (obj[field] === undefined) {
                    obj[field] = _constraints.defaultsTo[field];
                }
            }

            /**
             * Check the type of the field
             */
            for (field in _constraints.type) {
                if (obj[field] !== undefined && obj[field] !== null) {
                    if (typeof obj[field] !== _constraints.type[field]) {
                        return false;
                    }
                }
            }

            /**
             * Make sure all required fields are present
             */
            for (field of _constraints.required) {
                if (obj[field] === undefined) {
                    return false;
                }
            }

            /**
             * Check all notNull values
             */
            for (field of _constraints.notNull) {
                if (obj[field] !== undefined && obj[field] === null) {
                    return false;
                }
            }

            /**
             * Validate unique values
             */
            for (field of _constraints.unique) {
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? CasperUtils.getHash(obj[field]) : obj[field];
                    if (_indexes.unique[field][hash] !== undefined && _indexes.unique[field][hash] !== obj._id) {
                        return false;
                    }
                }
            }

            /**
             * Validate max value
             * For strings this is the length, for numbers it is the actual value
             */
            for (field in _constraints.min) {
                if (!_constraints.min.hasOwnProperty(field) || !obj.hasOwnProperty(field))
                    continue;

                v = typeof obj[field] === 'string' ? obj[field].length : obj[field];
                if (v < _constraints.min[field]) {
                    return false;
                }
            }

            /**
             * Validate max value
             * For strings this is the length, for numbers it is the actual value
             */
            for (field in _constraints.max) {
                if (!_constraints.min.hasOwnProperty(field) || !obj.hasOwnProperty(field))
                    continue;
                v = typeof obj[field] === 'string' ? obj[field].length : obj[field];
                if (v > _constraints.max[field]) {
                    return false;
                }
            }

            /**
             * Validate regex patterns
             */
            for (field in _constraints.pattern) {
                if (obj[field]) {
                    r = new RegExp(_constraints.pattern[field]);
                    if (!obj[field].match(r)) {
                        return false;
                    }
                }
            }

            return true;
        }

        function _createIndexes(obj, idx) {
            var field, hash;
            _indexes.id[obj._id] = idx;
            for (field of _constraints.unique) {
                if (obj[field]) {
                    hash = typeof obj[field] === 'string' ? CasperUtils.getHash(obj[field]) : obj[field];
                    _indexes.unique[field][hash] = obj._id;
                }
            }
        }

        this.save = function (obj) {
            var o = Object.assign({}, obj);

            if (!_checkConstraints(o)) {
                return false;
            }

            if (!o._id || _indexes.id[o._id] === undefined) {
                _runTriggers('beforeCreate', o);
                o._id = CasperUtils.getId();
                var idx = _records.push(o) - 1;
                _createIndexes(o, idx);
                _runTriggers('afterCreate', o);
                return o;
            }

            _runTriggers('beforeUpdate', o);
            _records[_indexes.id[o._id]] = o;
            //_createIndexes(o, _indexes.id[o._id]);
            _updateUniqueIndexes(o);
            _runTriggers('afterUpdate', o);
            return o;
        };

        // @deprecated - use save(obj)
        this.add = function (obj) {
            return _self.save(obj);
        };

        /**
         * Removes a record from the database
         */
        this.remove = function (obj) {
            if (!obj._id) {
                return false;
            }

            _runTriggers('beforeDelete', obj);

            for (var i = 0; i < _records.length; ++i) {
                if (_records[i]._id === obj._id) {
                    _records.splice(i, 1);
                    delete _indexes.id[obj._id];
                    for (var f in _indexes.unique) {
                        for (var u in _indexes.unique[f]) {
                            if (_indexes.unique[f][u] === obj._id) {
                                delete _indexes.unique[f][u];
                                break;
                            }
                        }
                    }
                    break;
                }
            }

            _runTriggers('afterDelete', obj);
        };

        this.findById = function (id) {
            if (!_indexes.id[id]) {
                for (var i = 0; i < _records.length; ++i) {
                    if (_records[i]._id === id) {
                        _indexes.id[id] = i;
                        return _records[i];
                    }
                }
                return null;
            }

            return _records[_indexes.id[id]];
        };

        this.find = function () {
            return ListQuery.from(_records);
        };

        this.findOne = function () {
            return _self.find().limit(1);
        };

        this.toList = function () {
            return _records;
        };

        this.count = function () {
            return _records.length;
        };
    };

    /**
     * CasperDatabase class
     */
    var CasperDatabase = function () {
        var _self = this,
            _database = {};

        this.createCollection = function (name, options) {
            if (!_database[name] && !_self[name]) {
                _database[name] = new CasperCollection(options);
                _self[name] = _database[name];
            }
        };

        this.getCollection = function (name) {
            return _database[name];
        };

        this.dropCollection = function (name) {
            if (_database[name])
                delete _database[name];
        };

        this.addConstraint = function (name, field, constraint) {
            _database[name].addConstraint(field, constraint);
        };

        this.save = function (repository, obj) {
            return _database[repository].add(obj);
        };

        this.remove = function (repository, obj) {
            _database[repository].remove(obj);
        };

        this.findAll = function (repository) {
            return _database[repository].toList();
        };

        this.find = function (repository, queryBuilder) {
            if (!queryBuilder) {
                return _database[repository].find();
            }
            return ListQuery.from(_database[repository].toList()).setQuery(queryBuilder).execute();
        };

        this.findOne = function (repository, query) {
            if (typeof query === 'string') {
                return _database[repository].findById(query);
            }
            return ListQuery.from(_database[repository].toList()).setQuery(query).limit(1).execute();
        };

        this.count = function (repository) {
            return _database[repository].count();
        };
    };

    return {
        CasperUtils: CasperUtils,
        ObjectMatcher: ObjectMatcher,
        QueryPart: QueryPart,
        QueryBuilder: QueryBuilder,
        ListQuery: ListQuery,
        CasperCollection: CasperCollection,
        CasperDatabase: CasperDatabase
    };

}());