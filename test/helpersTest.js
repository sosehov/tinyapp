const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return null when email is not found', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers)
    assert.isNull(user);
  });

  it('should handle empty email parameter', function() {
    const user = getUserByEmail("", testUsers);
    assert.isNull(user);
  });

  it('should handle empty database', function() {
    const user = getUserByEmail("user@example.com", {});
    assert.isNull(user);
  });

  it('should handle null database', function() {
    const user = getUserByEmail("user@example.com", null);
    assert.isNull(user);
  });

});