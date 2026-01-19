import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';
import { Avatar } from '@mantine/core';

const getFileUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface UserItem {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  userPhotoUrl?: string;
  userNotes?: string;
}

// Helper to generate a random strong password
const generateStrongPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const Accountants = () => {
  const getFormFields = (item?: UserItem): FormField[] => {
    const isEditing = !!item?.id;

    return [
      {
        fieldType: 'Text',
        formKey: 'fullName',
        label: 'Full Name',
        placeholder: 'Jane Smith',
        required: true,
        defaultTextValue: item?.fullName || '',
      },
      {
        fieldType: 'Text',
        formKey: 'email',
        label: 'Email Address',
        placeholder: 'jane@example.com',
        required: true,
        defaultTextValue: item?.email || '',
        disabled: isEditing,
      },
      {
        fieldType: 'Password',
        formKey: 'password',
        label: 'Password',
        placeholder: 'Auto-generated strong password',
        required: !isEditing,
        hidden: true,
        // Auto-generate password for new users, empty for edits
        defaultTextValue: isEditing ? '' : generateStrongPassword(),
      },
      {
        fieldType: 'File',
        formKey: 'userPhotoUrl',
        label: 'User Photo',
        placeholder: 'Upload photo',
        required: false,
        accept: 'image/png,image/jpeg',
        defaultFileValue: item?.userPhotoUrl || null,
      },
      // Force Role 'accountant'
      {
        fieldType: 'Text',
        formKey: 'role',
        label: 'Role',
        required: true,
        defaultTextValue: 'accountant',
        hidden: true,
      },
      {
        fieldType: 'Textarea',
        formKey: 'userNotes',
        label: 'Notes',
        required: false,
        defaultTextValue: item?.userNotes || '',
      }
    ];
  };

  return (
    <MasterDataPage<UserItem>
      title="Accountant Management" 
      description="Manage accountants who oversee financial data across projects."
      apiEndpoint="/api/v1/users?role=accountant"
      columns={[
        { 
            key: 'userPhotoUrl', 
            label: 'Photo',
            width: 80,
            render: (user) => (
              // FIX: Resolve URL here
              <Avatar src={getFileUrl(user.userPhotoUrl)} alt={user.fullName} radius="xl" />
            )
        },
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' }
      ]}
      formConfig={getFormFields}
    />
  );
};

export default Accountants;