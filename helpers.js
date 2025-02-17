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
    if (urlData.userID === userId) {
      userUrls[shortURL] = urlData;
    }
  }
  return userUrls;
};

// Generate a random 6-character string for a short URL ID
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };