module.exports = {
  preset: "ts-jest",
  rootDir: "",
  moduleNameMapper: {
    "@/(.*)$": "<rootDir>/$1",
  },
  // testMatch: ["<rootDir>/domain/test/step1.spec.ts"],
};
