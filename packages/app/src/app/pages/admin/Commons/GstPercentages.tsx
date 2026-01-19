import { MasterDataPage } from '@components/default/MasterDataPage';
import { FormField } from '@components/FormComponents/FormModal';

interface GstItem {
  id?: string;
  value?: string;
  label?: string;
}

const GstPercentages = () => {
  const getFormFields = (item?: GstItem): FormField[] => [
    {
      fieldType: 'Text',
      formKey: 'value',
      label: 'Value',
      placeholder: 'e.g. 18',
      required: true,
      defaultTextValue: item?.value || '',
    },
    {
      fieldType: 'Text',
      formKey: 'label',
      label: 'Display Label',
      placeholder: 'e.g. 18%',
      required: true,
      defaultTextValue: item?.label || '',
    }
  ];

  return (
    <MasterDataPage<GstItem>
      title="GST Percentages" 
      description="Manage GST percentage values and labels."
      apiEndpoint="/api/v1/master-data/gst-percentages"
      columns={[
        { key: 'value', label: 'Value' },
        { key: 'label', label: 'Label' }
      ]}
      formConfig={getFormFields}
    />
  );
};

export default GstPercentages;