/**
 * Testing it all out
 */
var testList = [{
    name: 'Dan',
    magic: 25,
    pet: 'lizard'
}, {
    name: 'Chris',
    magic: 30,
    pet: 'dragon'
}, {
    name: 'Aaron',
    magic: 14,
    pet: 'turtle'
}];

var testObj = {
    name: 'Tom',
    magic: 21,
    pet: 'turtle'
};

console.debug('casper', casper);

/**
 * The ObjectMatcher works exactly like the Java version
 */
var om = casper.ObjectMatcher.match(testObj).where('magic').in([12, 13, 21, 41, 22]).and('magic').between(10, 22).and('name').like('%o%');
console.debug('Test ObjectMatcher (true)', om.isMatch());

/**
 * The ListQuery works exactly like the Java version
 */
var ql = casper.ListQuery.from(testList).where('magic').eq(25).or('name').eq('Chris').execute();
console.debug('Test ListQuery (true)', ql);

/**
 * Creating databases and collections is identical to the Java version,
 * however, when a collection is created, a reference is added to the database
 * object to make access easier.
 *
 * Since we don't have access to the Java proxy/intercepter, it makes sense
 * to provide direct access to the collection.
 */
var db = new casper.Database();
db.createCollection('people');

for (var i = 0; i < testList.length; ++i) {

    // Traditionally, you would have to call db.save('people', o)
    // but the collection reference eliminates the need for this.
    testList[i] = db.people.save(testList[i]);
}

// Our list has been updated with the generated IDs
console.debug('Test that our list now has IDs', testList);

/**
 * With the new indexing, we can now find a record directly by id.
 * If using the old method this can be done with:
 *     db.findOne('people', someId);
 */
var person = db.people.findById(testList[testList.length - 1]._id);
console.debug('Found person by ID', person);

/**
 * ListQuery is now exposed by the collection using find()
 * Using the old method, if the query parameter is omitted, a ListQuery is returned
 *     db.find('people').where('name').eq(someName).execute();
 *
 * This prevents us from having to manually build a QueryBuilder
 * and pass it to our find method; although passing a QueryBuilder
 * is still supported.
 *
 * var qb = new QueryBuilder();
 * qb.add(casper.QueryBuilder.Command.Eq, 'name', 'Jim');
 * var results = db.find('people', qb);
 */
var people = db.people.find().where('name').eq('Aaron').execute();
console.debug('Found people by query', people);

/**
 * No database is complete without some constraints
 */

/**
 * To add a constraint to a single field use:
 *     collection.addConstraint(fieldName, constraint)
 * --
 * The constraint object is pretty simple
 * {
 *     unique: boolean, // This property is optional
 *     min: number, // This property is optional
 *     max: number, // This property is optional
 * }
 *
 * Note that if min and max are used on a string field, then they will
 * validate the length of the string. If they are used on a number,
 * they will validate the value of the field.
 */
db.people.addConstraint('name', {unique: true, min: 1, max: 10});
console.debug('Added single constraint', db.people.getConstraints());
var t = db.people.save(testObj);
t = db.people.save(testObj);
console.debug('Tried to add duplicate name (false)', t);

/**
 * To add constraints when creating your collection use:
 *     collection.createCollection(collectionName, {constraints: constraints});
 * --
 * The constraints definition expected is the same as described in the addConstraint()
 * explanation above
 * --
 * To add triggers when creating your collection add a triggers object to your
 * collection options like the following:
 *
 * {
 *     triggers: {
 *         beforeCreate: {
 *             triggerName: function (obj) {}
 *         }
 *     }
 * }
 *
 * The database record in question is passed to the trigger.
 * --
 * To add stored-procedures when creating a collection, add a procedures object
 * to the options
 *
 * {
 *     procedures: {
 *         procedureName: function () {}
 *     }
 * }
 *
 * Currently, procedure parameters are not supported
 */
db.createCollection('more_people', {
    constraints: {
        name: {
            unique: true,
            min: 3,
            max: 10,
            type: 'string',
            pattern: '^[a-zA-Z ]+$',
            required: true
        },
        magic: {
            min: 10,
            max: 30,
            notNull: true,
            defaultsTo: 18
        },
        pet: {
            indexed: true
        }
    },
    triggers: {
        beforeCreate: {
            test: function () {
                console.debug('TRIGGER: --> beforeCreate');
            }
        },
        afterCreate: {
            test: function () {
                console.debug('TRIGGER: --> afterCreate');
            }
        },
        beforeUpdate: {
            test: function () {
                console.debug('TRIGGER: --> beforeUpdate');
            }
        },
        afterUpdate: {
            test: function () {
                console.debug('TRIGGER: --> afterUpdate');
            }
        },
        beforeDelete: {
            test: function () {
                console.debug('TRIGGER: --> beforeDelete');
            }
        },
        afterDelete: {
            test: function () {
                console.debug('TRIGGER: --> afterDelete');
            }
        }
    },
    procedures: {
        test: function () {
            console.debug('PROC: --> test procedure called');
        }
    }
});

// Test calling a procedure
db.more_people.callProcedure('test');

// Add a new procedure
db.more_people.addProcedure('test2', function () {
    console.debug('PROC(test2): --> procedure called');
});
db.more_people.callProcedure('test2');

// Remove a procedure
db.more_people.dropProcedure('test');
db.more_people.callProcedure('test');

console.debug('Created collection with constraints', db.more_people.getConstraints());
t = db.more_people.save(testObj);
console.debug('Saved record', t);
var testId = t._id;
t = db.more_people.save(testObj);
console.debug('Tried to add another duplicate (false)', t);

// Remove beforeUpdate trigger
db.more_people.dropTrigger('beforeUpdate', 'test');

// Add a new beforeUpdate trigger
db.more_people.addTrigger('beforeUpdate', 'test2', function (val) {
    console.debug('TRIGGER(test2): --> Called beforeUpdate trigger on', val);
});

t = db.more_people.findById(testId);
t.name = 'Tommy';
t.magic = 30;
t.pet = 'cat';
t = db.more_people.save(t);
console.debug('Updated record', t);

db.more_people.remove(t);

for (p of testList) {
    db.more_people.save(p);
}

console.debug('Unique indexes', db.more_people.getIndexes().unique);
console.debug('Indexes', db.more_people.getIndexes().indexed);

t = db.more_people.save({name: 'D@n', magic: 20});
console.debug('Fail name pattern validation (false)', t);
t = db.more_people.save({magic: 20});
console.debug('Fail name required validation (false)', t);
t = db.more_people.save({name: 'Al', magic: 20});
console.debug('Fail name min validation (false)', t);
t = db.more_people.save({name: 'Abcdefghijklm', magic: 20});
console.debug('Fail name max validation (false)', t);
t = db.more_people.save({name: 12, magic: 20});
console.debug('Fail name type validation (false)', t);
t = db.more_people.save({name: 'Abc', magic: null});
console.debug('Fail magic notNull validation (false)', t);
t = db.more_people.save({name: 'Abc'});
console.debug('Test magic defaultsTo validation (18)', t.magic);


/**
 * This will slow the page down quite a bit.
 * Uncomment the following for query speed testing
 */
/*
 // Let's test storing a lot of data
 // and check some performance.
 db.createCollection('numbers');
 for (var i = 0; i < 100000; ++i) {
 db.numbers.save({count: i});
 }


 // First let's test a non-indexed query pulling the middle record
 var start = performance.now();
 var num1 = db.numbers.findOne().where('count').eq(49999).execute();
 var end = performance.now();
 console.debug('num1', num1);
 console.debug('Non-indexed query took', end - start, 'ms');


 // Next let's test an indexed query pulling the same record
 start = performance.now();
 var num2 = db.numbers.findById(num1._id);
 end = performance.now();
 console.debug('num2', num2);
 console.debug('Indexed query took', end - start, 'ms');


 // Now, let's pull the last record
 start = performance.now();
 var num3 = db.numbers.findOne().where('count').eq(99999).execute();
 end = performance.now();
 console.debug('num3', num3);
 console.debug('2nd Non-indexed query took', end - start, 'ms');

 // Again with indexed query
 start = performance.now();
 var num4 = db.numbers.findById(num3._id);
 end = performance.now();
 console.debug('num4', num4);
 console.debug('2nd Indexed query took', end - start, 'ms');
 */