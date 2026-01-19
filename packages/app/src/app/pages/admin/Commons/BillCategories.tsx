import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

interface BillCategoryItem {
  id?: string;
  name?: string;
}

const BillCategories = () => {
  const getFormFields = (item?: BillCategoryItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'name',
      label: 'Category Name',
      placeholder: 'e.g. Service',
      required: true,
      defaultTextValue: item?.name || '',
    }
  ];

  return (
    <MasterDataPage<BillCategoryItem>
      title="Bill Categories" 
      description="Manage categories for classifying invoice bills."
      apiEndpoint="/api/v1/master-data/bill-categories"
      columns={[{ key: 'name', label: 'Name' }]}
      formConfig={getFormFields}
    />
  );
};

export default BillCategories;