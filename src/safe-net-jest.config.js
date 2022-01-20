module.exports = {
  preset: "ts-jest",
  rootDir: "",
  moduleNameMapper: {
    "@/(.*)$": "<rootDir>/$1",
  },
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
};
