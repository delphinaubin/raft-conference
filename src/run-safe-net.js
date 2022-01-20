// eslint-disable-next-line @typescript-eslint/no-var-requires
const jest = require("jest");

const [, , stepNumber] = process.argv;
process.env.stepNumber = stepNumber;

const stepUnitTestFolder = `src/domain/test/steps`;
const stepsToRun = new Array(+stepNumber)
  .fill()
  .map((_, index) => index + 1)
  .map(
    (stepNumber) =>
      `--testPathPattern=${stepUnitTestFolder}/step${stepNumber}.spec.ts`
  );
jest.run(["--config", "./src/safe-net-jest.config.js", ...stepsToRun]);
