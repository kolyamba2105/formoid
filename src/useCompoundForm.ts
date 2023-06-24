import { useRef, useState } from "react";
import {
  FieldArrayValuesConstraint,
  FormValuesConstraint,
  Toggle,
  ValidatedValues,
  ValidationSchema,
  ValidationStrategy,
  makeFieldGroups,
  makeFieldProps,
  validateCompoundFieldArray,
  validateForm,
} from "./Form";
import { forEach, map } from "./Record";
import { isFailure, isSuccess } from "./Result";
import { UseFieldArrayReturn } from "./useFieldArray";
import { useFieldArrayState } from "./useFieldArrayState";
import { UseFormReturn } from "./useForm";
import { useFormState } from "./useFormState";

type RedundantFields = "handleSubmit" | "isSubmitting";

type CompoundValues<FormValues, FieldArrayValues> = {
  form: FormValues;
  fieldArray: FieldArrayValues;
};

type FieldArrayValidationSchema<FieldArrayValues extends FieldArrayValuesConstraint> = {
  [K in keyof FieldArrayValues]: ValidationSchema<FieldArrayValues[K][number]>;
};

type UseCompoundFormConfig<
  FormValues extends FormValuesConstraint,
  FormSchema extends ValidationSchema<FormValues>,
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
> = {
  form: {
    initialValues: FormValues;
    validationStrategy: ValidationStrategy;
    validators: (values: CompoundValues<FormValues, FieldArrayValues>) => FormSchema;
  };
  fieldArray: {
    initialValues: FieldArrayValues;
    validationStrategy: ValidationStrategy;
    validators: (values: CompoundValues<FormValues, FieldArrayValues>) => FieldArraySchema;
  };
};

type FieldArrayReturn<FieldArrayValues extends FieldArrayValuesConstraint> = {
  [K in keyof FieldArrayValues]: Omit<
    UseFieldArrayReturn<FieldArrayValues[K][number], never>,
    RedundantFields
  >;
};

type FieldArrayValidatedValues<
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
> = {
  [K in keyof FieldArrayValues]: Array<
    ValidatedValues<
      FieldArrayValues[K][number],
      FieldArraySchema[K] extends ValidationSchema<FieldArrayValues[K][number]>
        ? FieldArraySchema[K]
        : ValidationSchema<FieldArrayValues[K][number]>
    >
  >;
};

type OnSubmit<
  FormValues extends FormValuesConstraint,
  FormSchema extends ValidationSchema<FormValues>,
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
> = (
  values: CompoundValues<
    ValidatedValues<FormValues, FormSchema>,
    FieldArrayValidatedValues<FieldArrayValues, FieldArraySchema>
  >,
) => Promise<unknown>;

type OnSubmitMatch<
  FormValues extends FormValuesConstraint,
  FormSchema extends ValidationSchema<FormValues>,
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
> = {
  onFailure: () => unknown;
  onSuccess: OnSubmit<FormValues, FormSchema, FieldArrayValues, FieldArraySchema>;
};

type HandleSubmit<
  FormValues extends FormValuesConstraint,
  FormSchema extends ValidationSchema<FormValues>,
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
> = {
  (onSubmit: OnSubmit<FormValues, FormSchema, FieldArrayValues, FieldArraySchema>): void;
  (onSubmit: OnSubmitMatch<FormValues, FormSchema, FieldArrayValues, FieldArraySchema>): void;
};

type UseCompoundFormReturn<
  FormValues extends FormValuesConstraint,
  FormSchema extends ValidationSchema<FormValues>,
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
> = {
  fieldArray: FieldArrayReturn<FieldArrayValues>;
  form: Omit<UseFormReturn<FormValues, never>, RedundantFields>;
  handleSubmit: HandleSubmit<FormValues, FormSchema, FieldArrayValues, FieldArraySchema>;
  isSubmitting: boolean;
};

export function useCompoundForm<
  FormValues extends FormValuesConstraint,
  FormSchema extends ValidationSchema<FormValues>,
  FieldArrayValues extends FieldArrayValuesConstraint,
  FieldArraySchema extends FieldArrayValidationSchema<FieldArrayValues>,
>(
  config: UseCompoundFormConfig<FormValues, FormSchema, FieldArrayValues, FieldArraySchema>,
): UseCompoundFormReturn<FormValues, FormSchema, FieldArrayValues, FieldArraySchema> {
  const ref = useRef(config);
  const { form: formConfig, fieldArray: fieldArrayConfig } = ref.current;

  const form = useFormState(formConfig.initialValues);
  const fieldArray = map(fieldArrayConfig.initialValues, useFieldArrayState);

  const values: CompoundValues<FormValues, FieldArrayValues> = {
    form: form.values,
    fieldArray: map(fieldArray, ({ values }) => values) as FieldArrayValues,
  };

  const fieldProps = makeFieldProps({
    form,
    schema: formConfig.validators(values),
    validationStrategy: formConfig.validationStrategy,
  });
  const compoundFieldArray: FieldArrayReturn<FieldArrayValues> = map(fieldArray, (state, key) => ({
    append: state.append,
    errors: state.errors,
    groups: makeFieldGroups({
      fieldArray: state,
      schema: fieldArrayConfig.validators(values)[key],
      validationStrategy: fieldArrayConfig.validationStrategy,
    }),
    handleReset: state.reset,
    remove: state.remove,
    setErrors: state.setErrors,
    setValues: state.setValues,
    values: state.values,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle: Toggle = (action) => {
    setIsSubmitting(action === "disable");
    form.toggle(action);
    forEach(fieldArray, (item) => item.toggle(action));
  };

  const handleSubmit: HandleSubmit<FormValues, FormSchema, FieldArrayValues, FieldArraySchema> = (
    onSubmit,
  ) => {
    toggle("disable");
    Promise.all([
      validateForm(values.form, formConfig.validators(values)),
      validateCompoundFieldArray(values.fieldArray, fieldArrayConfig.validators(values)),
    ]).then(([formResult, fieldArrayResult]) => {
      if (isSuccess(formResult) && isSuccess(fieldArrayResult)) {
        const submit = onSubmit instanceof Function ? onSubmit : onSubmit.onSuccess;

        submit({ form: formResult.success, fieldArray: fieldArrayResult.success }).finally(() =>
          toggle("enable"),
        );
      } else {
        if (isFailure(formResult)) {
          form.propagateErrors(formResult.failure);
        }

        if (isFailure(fieldArrayResult)) {
          forEach(fieldArrayResult.failure, (errors, key) => {
            fieldArray[key].propagateErrors(errors ?? []);
          });
        }

        toggle("enable");

        if (onSubmit instanceof Function) return;

        onSubmit.onFailure();
      }
    });
  };

  return {
    fieldArray: compoundFieldArray,
    form: {
      errors: form.errors,
      fieldProps,
      handleReset: form.reset,
      setErrors: form.setErrors,
      setValues: form.setValues,
      values: form.values,
    },
    handleSubmit,
    isSubmitting,
  };
}
