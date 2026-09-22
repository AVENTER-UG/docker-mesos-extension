module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/test/styleMock.js",
    "\\.(gif|png|bmp|jpe?g|svg)$": "<rootDir>/test/fileMock.js",
  },
  setupFiles: ["<rootDir>/test/setup.js"],
};
