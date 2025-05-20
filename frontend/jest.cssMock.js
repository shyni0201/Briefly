module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
      "**/*.{js,jsx}",
      "!jest.cssMock.js", // Exclude jest.cssMock.js
      "!frontend/**",     // Exclude the entire frontend directory
      "!frontend/src/**"  // Exclude the frontend/src directory
    ],
    coverageDirectory: "coverage"
  };