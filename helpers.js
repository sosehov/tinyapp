// Helper function to lookup user in users object
const getUserByEmail = function(email, database) {
  for (const userid in database) {
    if (database[userid].email === email) {
      return database[userid];
    }
  }
  return null;
};

// Helper function to finding URLs associated with a specific userid
const urlsForUser = function(userId, urlDatabase) {
  const userUrls = {};

  // Ensure urlDatabase is not empty or null
  if (!urlDatabase) {
    return userUrls;
  }
  // Loop through the urlDatabase and add matching URLS to the result object
  for (const shortURL in urlDatabase) {
    const urlData = urlDatabase[shortURL];
    if ( urlData.userId === userId) {
      userUrls[shortURL] = urlData;
    }
  }
  return userUrls;
}

module.exports = { getUserByEmail, urlsForUser };