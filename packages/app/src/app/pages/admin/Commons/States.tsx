import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

interface StateItem {
  id?: string;
  name?: string;
}

const States = () => {
  const getFormFields = (item?: StateItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'name',
      label: 'State Name',
      placeholder: 'e.g. West Bengal',
      required: true,
      defaultTextValue: item?.name || '',
    }
  ];

  return (
    <MasterDataPage<StateItem> // Pass Generic Type Here
      title="States" 
      description="Manage the list of states used for project locations."
      apiEndpoint="/api/v1/master-data/states"
      columns={[{ key: 'name', label: 'Name' }]}
      formConfig={getFormFields} // No 'as any' needed!
    />
  );
};

export default States;