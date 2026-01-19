import { useState, useEffect } from 'react';
import { axios } from '@lib/axios';
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
  projectId?: string;
  projectName?: string;
  userPhotoUrl?: string;
  userNotes?: string;
}

interface ProjectOption {
  id: string;
  name: string;
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

const Staffs = () => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  // Fetch Projects for Dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/api/v1/projects');
        // Handle flattened or data wrapper
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };
    fetchProjects();
  }, []);

  const getFormFields = (item?: UserItem): FormField[] => {
    const isEditing = !!item?.id;

    return [
      {
        fieldType: 'Text',
        formKey: 'fullName',
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true,
        defaultTextValue: item?.fullName || '',
      },
      {
        fieldType: 'Text',
        formKey: 'email',
        label: 'Email Address',
        placeholder: 'john@example.com',
        required: true,
        defaultTextValue: item?.email || '',
        // Disable email editing to prevent identity issues
        disabled: isEditing, 
      },
      // Password field only for NEW users
      {
        fieldType: 'Password',
        formKey: 'password',
        label: 'Password',
        placeholder: 'Auto-generated strong password',
        // Only required if creating new
        required: !isEditing,
        hidden: true, // Hide when editing
        // Auto-generate password for new users, empty for edits
        defaultTextValue: isEditing ? '' : generateStrongPassword(),
      },
      {
        fieldType: 'Select',
        formKey: 'projectId',
        label: 'Assign Project',
        placeholder: 'Select Project',
        required: true,
        options: projects.map(p => ({ label: p.name, value: p.id })),
        defaultSelectedOption: item?.projectId || '',
      },
      {
        fieldType: 'File',
        formKey: 'userPhotoUrl',
        label: 'User Photo',
        placeholder: 'Upload photo',
        required: false,
        accept: 'image/png,image/jpeg',
        defaultFileValue: item?.userPhotoUrl || null,
        // Note: Currently FormModal doesn't preview existing images, 
        // but for uploading new ones, this is sufficient.
      },
      // Hidden Role Field (Force 'staff')
      {
        fieldType: 'Text',
        formKey: 'role',
        label: 'Role',
        required: true,
        defaultTextValue: 'staff',
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
      title="Staff Management" 
      description="Manage staff members and assign them to specific projects."
      apiEndpoint="/api/v1/users?role=staff" 
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
        { key: 'projectName', label: 'Assigned Project' },
        { key: 'status', label: 'Status' }
      ]}
      formConfig={getFormFields}
    />
  );
};

export default Staffs;