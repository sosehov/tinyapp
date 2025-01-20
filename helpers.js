// Helper function to lookup user in users object
const getUserByEmail = function(email, database) {
  for (const userid in database) {
    if (database[userid].email === email) {
      return database[userid];
    }
  }
  return null;
};

module.exports = { getUserByEmail };