# Casper.js - a _real_ in-memory database for JavaScript
In short, Casper.js is a JavaScript port of the Java CasperDB library with many enhancements. More specifically, Casper.js is a JavaScript in-memory database with all of the features you would expect from a database. It supports validation, indexing, intuitive SQL-style querying, triggers and stored procedures in a small and efficient library with absolutely no dependencies. Getting up and running with Casper is incredibly simple.

## Getting started
```html
<script src="dist/casper.js"></script>
```

## Creating a database
```javascript
var db = new casper.Database();
```

## Creating collections
Inspired by mongo, Casper stores JSON objects in collections.
```javascript
db.createCollection('people');
```
Once you have created a collection, you can access it directly from the database object.

## Removing collections
```javascript
db.dropCollection('people');
```

## Adding/Updating records
```javascript
var o = db.people.save({name: 'Bob', age: 34});
o.age = 35;
o = db.people.save(o);
```
A unique ID is automatically added to each new record and indexed. The saved record is returned by save.

## Finding records
There are two main ways to find a record.

If you know the ID
```javascript
var id = o._id;
o = db.people.findById(id);
```

If you would like to query
```javascript
o = db.people.findOne().where('name').eq('Bob').and('age').gt(30).execute();
l = db.people.find().where('name').like('%ob').execute();
```

As you can see, the querying is very SQL-inspired. It supports most of the operations you can find in MySQL.
 * eq - Equal
 * ne - Not equal
 * lt - Less-than
 * gt - Greater-than
 * lg - Less-than or Greater-than (Not equal)
 * like - Uses % as a wildcard
 * between - Checks if a numeric value is between two values
 * in - Checks if the value exists in an array of values

## Removing records
```javascript
db.people.remove(o);
```

## Adding constraints
Casper supports a handful of constraints
  * unique - The field should be unique
  * required - The field is required
  * notNull - The field cannot be null
  * min - The minimum length of a string or the minimum numeric value
  * max - The maximum length of a string or the maximum numeric value
  * defaultsTo - The default value if one is not supplied
  * pattern - A regex pattern
  * type - The typeof value of the field
  
Adding constraints is relatively straight-forward
```javascript
db.people.addConstraint('name', {unique: true, pattern: '^[A-Za-z ]+$', type: 'string'});
```
Currently dropping constraints is not supported

## Adding triggers
Casper supports six different trigger events
  * beforeCreate
  * afterCreate
  * beforeUpdate
  * afterUpdate
  * beforeDelete
  * afterDelete

Adding triggers is simple as well
```javascript
db.people.addTrigger('beforeCreate', 'triggerName', function (obj) {
  console.debug('I run before a record is created!');
});
```
The record being manipulated is passed to the trigger.

## Removing triggers
```javascript
db.people.dropTrigger('beforeCreate', 'triggerName');
```

## Adding stored-procedures
```javascript
db.people.addProcedure('procedureName', function () {
  console.debug('Procedure called');
});
```

## Calling stored-procedures
```javascript
db.people.callProcedure('procedureName');
```

## Removing stored-procedures
```javascript
db.people.dropProcedure('procedureName');
```

## Creating collections with constraints, triggers and procedures
To simplify adding constraints, triggers and procedures, they can be defined when creating a collections
```javascript
db.createCollection('people', {
  constraints: {
    name: {
      unique: true,
      pattern: '^[A-Za-z ]+$',
      type: 'string'
    },
    age: {
      min: 18,
      max: 99,
      defaultsTo: 30
    }
  },
  triggers: {
    beforeCreate: {
      triggerName: function (val) {
        console.debug('triggerName called on', val);
      }
    }
  },
  procedures: {
    procedureName: function () {
      console.debug('procedureName called');
    }
  }
});
```
