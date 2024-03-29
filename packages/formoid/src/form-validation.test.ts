import { validateForm } from "./Form";
import { failure, success } from "./Result";
import { LoginFormValues, loginSchema } from "./test-utils";

describe("Form validation", () => {
  describe("validate", () => {
    it("should validate data against loginSchema", () => {
      const result = (vs: LoginFormValues) => validateForm(vs, loginSchema(vs));

      const correctValues: LoginFormValues = {
        name: "username",
        password: "Password123",
        confirmPassword: "Password123",
      };

      expect(result(correctValues)).resolves.toEqual(success(correctValues));
      expect(result({ name: "", password: "", confirmPassword: "" })).resolves.toEqual(
        failure({
          name: ["Value should be a non-blank string!"],
          password: ["Value should be a non-blank string!"],
          confirmPassword: ["Value should be a non-blank string!"],
        }),
      );
      expect(result({ name: "   ", password: "   ", confirmPassword: "   " })).resolves.toEqual(
        failure({
          name: ["Value should be a non-blank string!"],
          password: ["Value should be a non-blank string!"],
          confirmPassword: ["Value should be a non-blank string!"],
        }),
      );
      expect(result({ name: "Hello", password: "", confirmPassword: "" })).resolves.toEqual(
        failure({
          name: null,
          password: ["Value should be a non-blank string!"],
          confirmPassword: ["Value should be a non-blank string!"],
        }),
      );
      expect(result({ name: "Hello", password: "aaa", confirmPassword: "aaa" })).resolves.toEqual(
        failure({
          name: null,
          password: [
            "Password length must be between 8 and 64 chars!",
            "Password must contain at least 1 uppercase letter!",
            "Password must contain at least 1 digit!",
          ],
          confirmPassword: null,
        }),
      );
      expect(result({ name: "Hello", password: "Admin123", confirmPassword: "aaa" })).resolves.toEqual(
        failure({
          name: null,
          password: null,
          confirmPassword: ["Passwords do not match!"],
        }),
      );
    });
  });
});
