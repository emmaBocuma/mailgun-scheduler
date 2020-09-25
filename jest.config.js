const path = require("path");

module.exports = {
  roots: [path.join(__dirname, "./src")],
  rootDir: path.join(__dirname, "."),
  testEnvironment: "node",
  testMatch: ["**/__tests__/**"],
  preset: "ts-jest",
  watchPlugins: [
    require.resolve("jest-watch-typeahead/filename"),
    require.resolve("jest-watch-typeahead/testname"),
  ],
};