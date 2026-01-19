import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

interface ProjectModeItem {
  id?: string;
  name?: string;
}

const ProjectModes = () => {
  const getFormFields = (item?: ProjectModeItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'name',
      label: 'Mode Name',
      placeholder: 'e.g. Direct',
      required: true,
      defaultTextValue: item?.name || '',
    }
  ];

  return (
    <MasterDataPage<ProjectModeItem>
      title="Modes of Project" 
      description="Define the various modes for project execution."
      apiEndpoint="/api/v1/master-data/project-modes"
      columns={[{ key: 'name', label: 'Name' }]}
      formConfig={getFormFields}
    />
  );
};

export default ProjectModes;