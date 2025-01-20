const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

// Define test data
const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('Testing helper function: getUserByEmail', function() {

  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return null when email is not found', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers)
    assert.isNull(user, 'User should be null when email is not found in database');
  });

  it('should handle empty email parameter', function() {
    const user = getUserByEmail("", testUsers);
    assert.isNull(user, 'User should be null when no email is passed as a parameter');
  });

  it('should handle empty database', function() {
    const user = getUserByEmail("user@example.com", {});
    assert.isNull(user, 'User should be null when database is empty');
  });

  it('should handle null database', function() {
    const user = getUserByEmail("user@example.com", null);
    assert.isNull(user, 'User should be null when database is null');
  });

});

describe('urlsForUser', function() {
  it('should return urls that belong to the specified user', function() {
    // Define test data
    const urlDatabase = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "user1" },
      "9sm5xK": { longURL: "http://www.google.com", userId: "user2" },
      "a1b2c3": { longURL: "http://www.example.com", userId: "user1" }
    };

    // Define expected output
    const expectedOutput = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "user1" },
      "a1b2c3": { longURL: "http://www.example.com", userId: "user1" }
    };

    // Call the function with userId 'user1'
    const result = urlsForUser('user1', urlDatabase);

    // Assert that the result matches the expected output
    assert.deepEqual(result, expectedOutput);
  });

  it('should return an empty object if the user has no urls', function() {
    // Define test data
    const urlDatabase = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "user1" },
      "9sm5xK": { longURL: "http://www.google.com", userId: "user2" }
    };

    // Call the function with userId 'user3' (a user that doesn't have any URLs)
    const result = urlsForUser('user3', urlDatabase);

    // Assert that the result is an empty object
    assert.deepEqual(result, {});
  });

  it('should return an empty object if the urlDatabase is empty', function() {
    // Define an empty urlDatabase
    const urlDatabase = {};

    // Call the function with any userId
    const result = urlsForUser('user1', urlDatabase);

    // Assert that the result is an empty object
    assert.deepEqual(result, {});
  });

  it('should return an empty object if the urlDatabase is null', function() {
    // Call the function with a null urlDatabase
    const result = urlsForUser('user1', null);

    // Assert that the result is an empty object
    assert.deepEqual(result, {});
  });

  it('should not return urls that don\'t belong to the specified user', function() {
    // Define test data
    const urlDatabase = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "user1" },
      "9sm5xK": { longURL: "http://www.google.com", userId: "user2" },
      "a1b2c3": { longURL: "http://www.example.com", userId: "user1" }
    };

    // Call the function with userId 'user1' (should only return user1's URLs)
    const result = urlsForUser('user1', urlDatabase);

    // Assert that the result does not include user2's URL
    assert.notProperty(result, "9sm5xK");
    // Assert that the result includes only user1's URLs
    assert.property(result, "b2xVn2");
    assert.property(result, "a1b2c3");
  });
});