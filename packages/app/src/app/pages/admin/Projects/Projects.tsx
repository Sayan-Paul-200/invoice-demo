import { useState, useEffect } from 'react';
import { axios } from '@lib/axios';
import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

// Interface matching the "Flattened" data from our backend
interface ProjectItem {
  id?: string;
  name?: string;
  modeOfProjectId?: string;
  modeName?: string;     // For Display
  stateIds?: string[];   // For Form (Array of IDs)
  stateNames?: string;   // For Display (Comma separated)
}

// Interfaces for Dropdown Data
interface ModeOption { id: string; name: string; }
interface StateOption { id: string; name: string; }

const Projects = () => {
  const [modes, setModes] = useState<ModeOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);

  // Fetch Options for Dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [modesRes, statesRes] = await Promise.all([
          axios.get('/api/v1/master-data/project-modes'),
          axios.get('/api/v1/master-data/states')
        ]);
        // Handle array or { data: [] } structure
        const modesData = Array.isArray(modesRes.data) ? modesRes.data : modesRes.data.data;
        const statesData = Array.isArray(statesRes.data) ? statesRes.data : statesRes.data.data;

        setModes(modesData || []);
        setStates(statesData || []);
      } catch (err) {
        console.error("Failed to load project options", err);
      }
    };
    fetchOptions();
  }, []);

  // Form Configuration
  const getFormFields = (item?: ProjectItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'name',
      label: 'Project Name',
      placeholder: 'e.g. Solar Power Plant',
      required: true,
      defaultTextValue: item?.name || '',
    },
    {
      fieldType: 'Select',
      formKey: 'modeOfProjectId',
      label: 'Mode of Project',
      placeholder: 'Select Mode',
      required: true,
      options: modes.map(m => ({ label: m.name, value: m.id })), // Map ID to Value
      defaultSelectedOption: item?.modeOfProjectId || '',
    },
    {
      fieldType: 'MultiSelect',
      formKey: 'stateIds',
      label: 'States',
      placeholder: 'Select States',
      required: true,
      options: states.map(s => ({ label: s.name, value: s.id })), // Map ID to Value
      defaultMultiSelectValue: item?.stateIds || [],
    }
  ];

  return (
    <MasterDataPage<ProjectItem>
      title="Projects" 
      description="Manage projects, assign modes, and link them to multiple states."
      apiEndpoint="/api/v1/projects"
      columns={[
        { key: 'name', label: 'Project Name' },
        { key: 'modeName', label: 'Mode' },   // Shows "Direct" instead of UUID
        { key: 'stateNames', label: 'States' } // Shows "WB, MH" instead of UUIDs
      ]}
      formConfig={getFormFields}
    />
  );
};

export default Projects;