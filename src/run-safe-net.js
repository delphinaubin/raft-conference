// eslint-disable-next-line @typescript-eslint/no-var-requires
const jest = require("jest");

// TODO DAU : Take the step number in argument and run only applicable specs
jest.run([
  "--config",
  "./src/safe-net-jest.config.js",
  "--testPathPattern=src/domain/test/step1.spec.ts",
  "--testPathPattern=src/domain/test/step2.spec.ts",
]);
