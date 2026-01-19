import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

interface StatusItem {
  id?: string;
  name?: string;
}

const Statuses = () => {
  const getFormFields = (item?: StatusItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'name',
      label: 'Status Name',
      placeholder: 'e.g. Paid',
      required: true,
      defaultTextValue: item?.name || '',
    }
  ];

  return (
    <MasterDataPage<StatusItem>
      title="Invoice Statuses" 
      description="Configure the available statuses for invoices."
      apiEndpoint="/api/v1/master-data/invoice-statuses"
      columns={[{ key: 'name', label: 'Name' }]}
      formConfig={getFormFields}
    />
  );
};

export default Statuses;