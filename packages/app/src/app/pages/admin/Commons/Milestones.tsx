import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

interface MilestoneItem {
  id?: string;
  name?: string;
}

const Milestones = () => {
  const getFormFields = (item?: MilestoneItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'name',
      label: 'Milestone Name',
      placeholder: 'e.g. 60%',
      required: true,
      defaultTextValue: item?.name || '',
    }
  ];

  return (
    <MasterDataPage<MilestoneItem>
      title="Milestones" 
      description="Set up standard milestones for project tracking."
      apiEndpoint="/api/v1/master-data/milestones"
      columns={[{ key: 'name', label: 'Name' }]}
      formConfig={getFormFields}
    />
  );
};

export default Milestones;