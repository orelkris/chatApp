const generateMessage = (username, text) => {
  return {
    username,
    text,
    timestamp: new Date().getTime(),
  };
};

const generateLocationMessage = (location) => {
  return {
    location,
    timestamp: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};
