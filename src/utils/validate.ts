import { ConstructorParams } from "../common/types";
import { PACKAGE_NAME } from "../common/constants";

export const validateArgs = (args: ConstructorParams): void => {
  const required = ["apiKey", "templates", "to", "from", "delay"];

  required.forEach((requiredArg: string) => {
    if (args[requiredArg] === undefined) {
      throw new Error(`${PACKAGE_NAME}: ${requiredArg} must be defined`);
    }
  });
};
