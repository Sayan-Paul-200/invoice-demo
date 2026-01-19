// ... imports ...
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Button, Group, Table, ActionIcon, Paper, Text, LoadingOverlay, Stack, TextInput, Modal
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconFileTypeXls } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { utils, writeFile } from 'xlsx'; 
import { axios } from '@lib/axios';
import { FormModal, FormField, FormValue } from '@components/FormComponents/FormModal';
import { PageTitle } from '@components/PageContentComponents/PageTitle';

// ... (types and props remain same) ...
export type MasterDataColumn<T = any> = {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode; 
    width?: string | number;
};
  
export interface BaseItem {
    id?: string;
    [key: string]: any; 
}
  
type MasterDataPageProps<T extends BaseItem> = {
    title: string;
    description: string;
    apiEndpoint: string;
    columns: MasterDataColumn<T>[];
    formConfig: (item?: T) => FormField[]; 
};

// Helper to Append ID preserving Query Params
const appendIdToEndpoint = (endpoint: string, id: string) => {
  if (endpoint.includes('?')) {
    const [baseUrl, queryString] = endpoint.split('?');
    return `${baseUrl}/${id}?${queryString}`;
  }
  return `${endpoint}/${id}`;
};

export const MasterDataPage = <T extends BaseItem>({ 
  title, description, apiEndpoint, columns, formConfig 
}: MasterDataPageProps<T>) => {
  
  // ... (state remain same) ...
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ... (fetchData, useEffect, filteredData, handleExport remain same) ...
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiEndpoint);
      const responseData = response.data;
      if (Array.isArray(responseData)) {
        setData(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        setData(responseData.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Failed to fetch data', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item) => {
      return columns.some((col) => 
        String(item[col.key] || '').toLowerCase().includes(lowerQuery)
      );
    });
  }, [data, searchQuery, columns]);

  const handleExport = () => {
    const exportData = filteredData.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        row[col.label] = item[col.key];
      });
      return row;
    });

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, title);
    const timestamp = new Date().toISOString().split('T')[0];
    writeFile(workbook, `${title.replace(/\s+/g, '_')}_${timestamp}.xlsx`);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const url = appendIdToEndpoint(apiEndpoint, itemToDelete);
      await axios.delete(url);
      notifications.show({ title: 'Success', message: 'Item deleted successfully', color: 'green' });
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Failed to delete item', color: 'red' });
    } finally {
      setDeleting(false);
    }
  };

  // --- NEW: Handle File Uploads Automatically ---
  const handleFormSubmit = async (values: Record<string, FormValue>) => {
    setSubmitting(true);
    try {
      const processedValues = { ...values };

      // 1. Scan for File objects and upload them
      for (const key of Object.keys(processedValues)) {
        const val = processedValues[key];
        if (val instanceof File) {
          const formData = new FormData();
          formData.append('file', val);
          
          // Upload to Storage API
          const uploadRes = await axios.post('/api/v1/storage/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Replace File object with the returned URL string
          processedValues[key] = uploadRes.data.url;
        }
      }

      // 2. Submit to Entity API with URLs instead of Files
      if (editingItem && editingItem.id) {
        const url = appendIdToEndpoint(apiEndpoint, editingItem.id);
        await axios.put(url, processedValues);
        notifications.show({ title: 'Success', message: 'Item updated successfully', color: 'green' });
      } else {
        await axios.post(apiEndpoint, processedValues);
        notifications.show({ title: 'Success', message: 'Item created successfully', color: 'green' });
      }
      setFormModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Operation failed', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const rows = filteredData.map((item) => (
    <Table.Tr key={item.id}>
      {columns.map((col) => (
        <Table.Td key={col.key} width={col.width}>
            {col.render ? col.render(item) : String(item[col.key] || '')}
        </Table.Td>
      ))}
      <Table.Td width="100px">
        <Group gap="xs" justify="center">
          <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(item)} title="Edit">
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="subtle" 
            color="red" 
            onClick={() => item.id && openDeleteModal(item.id)} 
            title="Delete"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg" pb="xl">
       <PageTitle title={title} description={description} />
      
      <Group justify="space-between" align="center">
        <TextInput 
          placeholder={`Search ${title}...`} 
          leftSection={<IconSearch size={16} />} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ width: 300 }}
        />
        <Group>
          <Button 
            leftSection={<IconFileTypeXls size={18} />} 
            variant="default" 
            onClick={handleExport}
            disabled={data.length === 0}
          >
            Export
          </Button>
          <Button leftSection={<IconPlus size={18} />} onClick={handleCreate}>
            Add New
          </Button>
        </Group>
      </Group>

      <Paper p={0} radius="md" withBorder style={{ overflow: 'hidden' }} pos="relative">
        <LoadingOverlay visible={loading} zIndex={100} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th key={col.key}>{col.label}</Table.Th>
              ))}
              <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? rows : (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 1} align="center" style={{ padding: '40px 0' }}>
                  <Text c="dimmed" size="sm">
                    {searchQuery ? 'No matching records found' : 'No data available'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <FormModal
        opened={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={`${editingItem ? 'Edit' : 'Create'} ${title}`}
        formFields={formConfig(editingItem || undefined)}
        onSubmit={handleFormSubmit}
        loading={submitting}
        submitButtonText={editingItem ? 'Update' : 'Create'}
        centered
      />

      <Modal 
        opened={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        centered
      >
        <Stack>
          <Text size="sm">Are you sure you want to delete this item? This action cannot be undone.</Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={deleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};