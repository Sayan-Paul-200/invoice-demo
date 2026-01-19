import { useEffect } from 'react';
import { 
  Modal, 
  PasswordInput, 
  Textarea, 
  TextInput, 
  NumberInput, 
  Switch, 
  Select, 
  MultiSelect,
  Checkbox, 
  Radio, 
  Group, 
  Stack, 
  Button, 
  Alert, 
  FileInput,
  LoadingOverlay,
  Image,
  Text,
  ActionIcon,
} from '@mantine/core';
import { DatePickerInput, DateValue } from '@mantine/dates';
import { useForm, UseFormReturnType } from '@mantine/form';
import { IconInfoCircle, IconUpload, IconX } from '@tabler/icons-react';
import type { AlertVariant, MantineColor } from '@mantine/core';

// HELPER: Resolve Relative URLs
const getFileUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already absolute
  // Use Vite env var or fallback to localhost:3000 (Backend Port)
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Ensure we don't double slash
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

// --- Types ---

// Update FormValue to include string[] for MultiSelect and string (URL) for File
export type FormValue = string | boolean | number | DateValue | File | string[] | null;

// Add 'MultiSelect' to types
type FormFieldType = 'Text' | 'Password' | 'Textarea' | 'Number' | 'Select' | 'MultiSelect' | 'Checkbox' | 'Radio' | 'Switch' | 'Date' | 'File';

type Options = {
  label: string;
  value: string;
};

type FormFieldValidationFunction = (value: FormValue, values: Record<string, FormValue>) => string | null;

export type FormField = {
  fieldType: FormFieldType;
  formKey: string;
  label: string;
  description?: string;
  required?: boolean;
  options?: Options[];
  placeholder?: string;
  
  // Dynamic props
  hidden?: boolean | ((values: Record<string, FormValue>) => boolean);
  disabled?: boolean | ((values: Record<string, FormValue>) => boolean);
  minDate?: Date | ((values: Record<string, FormValue>) => Date | undefined | null);
  maxDate?: Date | ((values: Record<string, FormValue>) => Date | undefined | null);
  accept?: string; 

  defaultTextValue?: string | null;
  defaultNumberValue?: number | null;
  defaultToggleValue?: boolean | null;
  defaultSelectedOption?: string | null;
  defaultMultiSelectValue?: string[];
  defaultDateValue?: DateValue | null;
  defaultFileValue?: File | string | null; // <--- Updated to allow URL string
  
  validate?: FormFieldValidationFunction;
};

export type FormModalProps = {
  title: string;
  opened: boolean;
  onClose: () => void;
  centered?: boolean; 
  size?: string | number;

  submitButtonText?: string;
  cancelButtonText?: string;

  alert?: {
    title: string;
    message: string;
    color?: MantineColor;
    variant?: AlertVariant;
  };

  formFields: FormField[];

  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  onSubmit?: (values: Record<string, FormValue>) => Promise<void>;
  onSuccess?: () => Promise<void> | void;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
  onValuesChange?: (values: Record<string, FormValue>, form: UseFormReturnType<Record<string, FormValue>>) => void;
};

type FormInitialValues = {
  initialValues: Record<string, FormValue>;
  validate: Record<string, FormFieldValidationFunction>;
};

type UseFormType = UseFormReturnType<Record<string, FormValue>, (values: Record<string, FormValue>) => Record<string, FormValue>>;

// --- Component ---

export function FormModal({
  title,
  opened,
  onClose,
  centered = true, 
  size = 'md',
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  alert,
  formFields,
  loading = false,
  setLoading,
  onSubmit,
  onSuccess,
  onError,
  onFinally,
  onValuesChange,
}: FormModalProps) {
  
  const form = useForm(setupForm(formFields));

  useEffect(() => {
    if (opened) {
      const initialValues = setupForm(formFields).initialValues;
      form.setValues(initialValues);
      form.resetDirty();
    }
  }, [opened]);

  useEffect(() => {
      if(opened) {
         // This ensures that if the item data loads slightly later or changes, the form updates
         const values = setupForm(formFields).initialValues;
         // Only update if different to avoid typing loops, but for Edit Mode init it's fine
         // We rely on 'opened' mostly, but this is a fallback for data reactivity
      }
  }, [formFields, opened]);

  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(form.values, form);
    }
  }, [form.values, onValuesChange]); 

  const isDisabled = form.submitting || loading;

  const handleOnSubmit = async (values: Record<string, FormValue>) => {
    setLoading?.(true);
    try {
      await onSubmit?.(values);
      form.reset();
      await onSuccess?.();
    } catch (error) {
      await onError?.(error);
    } finally {
      setLoading?.(false);
      await onFinally?.();
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={title} 
      size={size} 
      centered={centered}
      closeOnClickOutside={!loading} // Prevent closing while uploading/submitting
    >
      <form onSubmit={form.onSubmit(handleOnSubmit)} style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        
        {alert && (
          <Alert title={alert.title} color={alert.color} variant={alert.variant} mb="md" icon={<IconInfoCircle />}>
            {alert.message}
          </Alert>
        )}

        <Stack gap="md">
          {formFields.map((field) => renderFormField(field, form, isDisabled))}
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={isDisabled}>
            {cancelButtonText}
          </Button>
          <Button type="submit" disabled={isDisabled} loading={loading}>
            {submitButtonText}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

// --- Helper Functions ---

function renderFormField(field: FormField, form: UseFormType, globalDisabled = false) {
  const isHidden = typeof field.hidden === 'function' ? field.hidden(form.values) : field.hidden;
  if (isHidden) return null;

  const resolveDisabled = typeof field.disabled === 'function' ? field.disabled(form.values) : field.disabled;
  const isDisabled = globalDisabled || (resolveDisabled ?? false);

  const rawMinDate = typeof field.minDate === 'function' ? field.minDate(form.values) : field.minDate;
  const minDate = rawMinDate ?? undefined;

  const rawMaxDate = typeof field.maxDate === 'function' ? field.maxDate(form.values) : field.maxDate;
  const maxDate = rawMaxDate ?? undefined;

  switch (field.fieldType) {
    case 'Text':
      return (
        <TextInput
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'Password':
      return (
        <PasswordInput
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'Textarea':
      return (
        <Textarea
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'Number':
      return (
        <NumberInput
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          decimalScale={2}
          fixedDecimalScale
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'Checkbox':
      return (
        <Checkbox
          label={field.label}
          description={field.description}
          required={field.required}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey, { type: 'checkbox' })}
        />
      );
    case 'Switch':
      return (
        <Switch
          label={field.label}
          description={field.description}
          required={field.required || false}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey, { type: 'checkbox' })}
        />
      );
    case 'Radio':
      return (
        <Radio.Group
          label={field.label}
          description={field.description}
          withAsterisk={field.required}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        >
          <Group mt="xs">
            {field.options?.map((option) => (
              <Radio 
                key={option.value} 
                value={option.value} 
                label={option.label} 
                disabled={isDisabled} 
              />
            ))}
          </Group>
        </Radio.Group>
      );
    case 'Select':
      return (
        <Select
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          data={field.options}
          searchable={true}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'MultiSelect':
      return (
        <MultiSelect
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          data={field.options}
          searchable={true}
          clearable={true}
          hidePickedOptions={true}
          disabled={isDisabled}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'Date':
      return (
        <DatePickerInput
          valueFormat="YYYY-MM-DD"
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          disabled={isDisabled}
          minDate={minDate}
          maxDate={maxDate}
          key={form.key(field.formKey)}
          {...form.getInputProps(field.formKey)}
        />
      );
    case 'File': {
      const currentValue = form.values[field.formKey];
      
      let previewUrl = '';
      let isPreviewable = false;
      let fileName = 'Selected File';

      if (currentValue instanceof File) {
        // Handle New File Upload (Create/Edit mode)
        previewUrl = URL.createObjectURL(currentValue);
        isPreviewable = currentValue.type.startsWith('image/');
        fileName = currentValue.name;
      } else if (typeof currentValue === 'string' && currentValue.length > 0) {
        // Handle Existing URL (Edit mode)
        previewUrl = getFileUrl(currentValue);
        isPreviewable = true; // Assume saved URL is an image based on usage
        fileName = currentValue.split('/').pop() || 'File';
      }

      return (
        <Stack key={form.key(field.formKey)} gap="xs">
          <FileInput 
            label={field.label}
            description={field.description}
            placeholder={field.placeholder}
            withAsterisk={field.required}
            disabled={isDisabled}
            accept={field.accept}
            leftSection={<IconUpload size={14} />}
            {...form.getInputProps(field.formKey)}
            value={currentValue instanceof File ? currentValue : null}
            onChange={(payload) => form.setFieldValue(field.formKey, payload)}
          />
          
          {isPreviewable && previewUrl && (
            <Group gap="sm" align="center" mt={-5} justify="space-between" style={{ border: '1px solid #eee', padding: '5px', borderRadius: '4px' }}>
               <Group gap="sm">
                 <Image 
                   src={previewUrl} 
                   w={50} h={50} radius="sm" 
                   fit="cover" 
                   fallbackSrc="https://placehold.co/50x50?text=Error"
                 />
                 <Stack gap={0}>
                   <Text size="xs" c="dimmed">Preview</Text>
                   <Text size="sm" fw={500} truncate w={180} style={{ overflow: 'hidden' }}>
                      {fileName}
                   </Text>
                 </Stack>
               </Group>
               <ActionIcon 
                 variant="subtle" 
                 color="red" 
                 onClick={() => form.setFieldValue(field.formKey, null)}
                 disabled={isDisabled}
               >
                 <IconX size={16} />
               </ActionIcon>
            </Group>
          )}
        </Stack>
      );
    }

    default:
      return null;
  }
}

function setupForm(formFields: FormField[]): FormInitialValues {
  const formData: FormInitialValues = {
    initialValues: {},
    validate: {},
  };

  formFields.forEach((field) => {
    if (field.fieldType === 'Text' || field.fieldType === 'Password' || field.fieldType === 'Textarea') {
      formData.initialValues[field.formKey] = field.defaultTextValue ?? '';
    } else if (field.fieldType === 'Number') {
      formData.initialValues[field.formKey] = field.defaultNumberValue || 0;
    } else if (field.fieldType === 'Switch' || field.fieldType === 'Checkbox') {
      formData.initialValues[field.formKey] = field.defaultToggleValue || false;
    } else if ((field.fieldType === 'Select' || field.fieldType === 'Radio') && field.options) {
      formData.initialValues[field.formKey] = field.defaultSelectedOption || '';
    } else if (field.fieldType === 'MultiSelect') {
       formData.initialValues[field.formKey] = field.defaultMultiSelectValue || [];
    } else if (field.fieldType === 'Date') {
       if (field.defaultDateValue instanceof Date && !isNaN(field.defaultDateValue.getTime())) {
         formData.initialValues[field.formKey] = field.defaultDateValue;
       } else {
         formData.initialValues[field.formKey] = null;
       }
    } else if (field.fieldType === 'File') {
       // Allow string URL or null
       formData.initialValues[field.formKey] = field.defaultFileValue || null;
    }

    if (field.required || field.validate) {
      formData.validate[field.formKey] = (value, values) => {
        if (field.required) {
             // If it's a File field, it's valid if it has a File OR a String (existing URL)
             if (field.fieldType === 'File') {
                 if (!value) return `${field.label} is required`;
             } else {
                 if (typeof value === 'string' && value.trim() === '') return `${field.label} is required`;
                 if (value === null || value === undefined) return `${field.label} is required`;
                 // Check for empty array in MultiSelect
                 if (Array.isArray(value) && value.length === 0) return `${field.label} is required`;
             }
        }
        if (field.validate) return field.validate(value, values);
        return null;
      };
    }
  });
  return formData;
}