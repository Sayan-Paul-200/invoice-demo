import { useMemo, useState } from 'react';
import { Stack, Paper, Group, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFileTypeXls, IconTrash } from '@tabler/icons-react';
import { utils, writeFile } from 'xlsx';

import { DUMMY_INVOICES, Invoice } from '@lib/invoices';
import { InvoiceTable } from '@components/default/InvoiceTable';
import { DashboardFilters, FilterState } from '@components/dashboard/DashboardFilters';
import { FormModal, FormField, FormValue } from '@components/FormComponents/FormModal';

const Invoices = () => {
  // --- Data & Selection State ---
  const [allInvoices, setAllInvoices] = useState(DUMMY_INVOICES);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  // 👇 State to track which invoice is being edited
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // --- Drawer State ---
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Filter State ---
  const [filters, setFilters] = useState<FilterState>({
    project: null,
    state: null,
    status: null,
    billCategory: null,
    dateRange: [null, null]
  });

  // --- Extract Options for Selects ---
  const options = useMemo(() => {
    const p = new Set<string>();
    const m = new Set<string>();
    const s = new Set<string>();
    const st = new Set<string>();
    const bc = new Set<string>();
    const ms = new Set<string>();
    const gst = new Set<string>();

    allInvoices.forEach(inv => {
      if (inv.project) p.add(inv.project);
      if (inv.modeOfProject) m.add(inv.modeOfProject);
      if (inv.state) s.add(inv.state);
      if (inv.status) st.add(inv.status);
      if (inv.billCategory) bc.add(inv.billCategory);
      if (inv.milestone) ms.add(inv.milestone);
      if (inv.gstPercentageApplicable) gst.add(inv.gstPercentageApplicable);
    });

    return {
      projects: Array.from(p).sort(),
      modes: Array.from(m).sort(),
      states: Array.from(s).sort(),
      statuses: Array.from(st).sort(),
      billCategories: Array.from(bc).sort(),
      milestones: Array.from(ms).sort(),
      gstPercentages: Array.from(gst).sort(),
    };
  }, [allInvoices]);

  // --- Filter Logic ---
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      if (filters.project && inv.project !== filters.project) return false;
      if (filters.state && inv.state !== filters.state) return false;
      if (filters.billCategory && inv.billCategory !== filters.billCategory) return false;
      if (filters.status && inv.status !== filters.status) return false;

      const [start, end] = filters.dateRange;
      if (start && end) {
        const invDate = new Date(inv.invoiceDate);
        const startDate = new Date(start);
        const endDate = new Date(end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        const checkDate = new Date(invDate);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate < startDate || checkDate > endDate) return false;
      }
      return true;
    });
  }, [filters, allInvoices]);

  // --- Helper to format date ---
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const formatDateForExcel = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; 
    return date.toISOString().split('T')[0];
  };

  // --- Actions ---
  const handleExport = () => {
    const exportData = filteredInvoices.map(inv => ({
      ...inv,
      'Invoice Date': formatDateForExcel(inv.invoiceDate),
      'Submission Date': formatDateForExcel(inv.submissionDate),
      'Payment Date': formatDateForExcel(inv.paymentDate),
    }));
    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Invoices');
    const timestamp = new Date().toISOString().split('T')[0];
    writeFile(workbook, `Invoices_Export_${timestamp}.xlsx`);
  };

  const handleDeleteInvoices = () => {
    if (selectedRows.length === 0) return;
    setAllInvoices((current) => current.filter((inv) => !selectedRows.includes(inv.slNo)));
    setSelectedRows([]);
  };

  // 👇 Handle Opening Drawer for Creation
  const handleOpenCreate = () => {
    setEditingInvoice(null);
    openDrawer();
  };

  // 👇 Handle Opening Drawer for Edit
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    openDrawer();
  };

  // --- Save Invoice (Create or Update) ---
  const handleSaveInvoice = async (values: any) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API

    const processedInvoiceData = {
      project: values.project,
      modeOfProject: values.modeOfProject,
      state: values.state,
      billCategory: values.billCategory,
      milestone: values.milestone,
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoiceDate ? formatDateForDisplay(values.invoiceDate) : '',
      submissionDate: values.submissionDate ? formatDateForDisplay(values.submissionDate) : '',
      invoiceBasicAmount: Number(values.invoiceBasicAmount),
      gstPercentageApplicable: values.gstPercentageApplicable,
      invoiceGstAmount: Number(values.invoiceGstAmount),
      totalAmount: Number(values.totalAmount),
      
      passedAmountByClient: Number(values.passedAmountByClient || 0),
      retention: Number(values.retention || 0),
      gstWithheld: Number(values.gstWithheld || 0),
      tds: Number(values.tds || 0),
      gstTds: Number(values.gstTds || 0),
      bocw: Number(values.bocw || 0),
      lowDepthDeduction: Number(values.lowDepthDeduction || 0),
      ld: Number(values.ld || 0),
      slaPenalty: Number(values.slaPenalty || 0),
      penalty: Number(values.penalty || 0),
      otherDeduction: Number(values.otherDeduction || 0),
      totalDeduction: Number(values.totalDeduction || 0),
      netPayable: Number(values.netPayable || 0),
      amountPaidByClient: Number(values.amountPaidByClient || 0),
      balancePendingAmount: Number(values.balancePendingAmount || 0),
      paymentDate: values.paymentDate ? formatDateForDisplay(values.paymentDate) : '',
      
      status: values.status,
      remarks: values.remarks,
    };

    if (editingInvoice) {
      // Update existing
      setAllInvoices(prev => prev.map(inv => 
        inv.slNo === editingInvoice.slNo 
          ? { ...inv, ...processedInvoiceData } 
          : inv
      ));
    } else {
      // Create new
      const newInvoice: Invoice = {
        slNo: Math.max(0, ...allInvoices.map(i => i.slNo)) + 1,
        ...processedInvoiceData
      } as Invoice;
      setAllInvoices(prev => [newInvoice, ...prev]);
    }
  };

  // --- Form Logic: Calculations & Validations ---
  const handleFormValuesChange = (values: Record<string, FormValue>, form: any) => {
    // 1. Calculate GST and Total Amount
    const basic = Number(values.invoiceBasicAmount || 0);
    const gstPercentStr = values.gstPercentageApplicable as string;
    
    let gstRate = 0;
    if (gstPercentStr && gstPercentStr.includes('%')) {
        gstRate = parseFloat(gstPercentStr) / 100;
    }
    
    const gstAmt = parseFloat((basic * gstRate).toFixed(2));
    const totalAmt = parseFloat((basic + gstAmt).toFixed(2));

    if (values.invoiceGstAmount !== gstAmt) form.setFieldValue('invoiceGstAmount', gstAmt);
    if (values.totalAmount !== totalAmt) form.setFieldValue('totalAmount', totalAmt);

    // 2. Calculate Deductions & Balance
    if (values.status === 'Paid') {
        const deductionFields = [
            'retention', 'gstWithheld', 'tds', 'gstTds', 'bocw', 
            'lowDepthDeduction', 'ld', 'slaPenalty', 'penalty', 'otherDeduction'
        ];
        
        const totalDeduction = deductionFields.reduce((sum, field) => {
            return sum + Number(values[field] || 0);
        }, 0);

        const netPayable = parseFloat((totalAmt - totalDeduction).toFixed(2));
        const paidByClient = Number(values.amountPaidByClient || 0);
        const balance = parseFloat((netPayable - paidByClient).toFixed(2));

        if (values.totalDeduction !== totalDeduction) form.setFieldValue('totalDeduction', totalDeduction);
        if (values.netPayable !== netPayable) form.setFieldValue('netPayable', netPayable);
        if (values.balancePendingAmount !== balance) form.setFieldValue('balancePendingAmount', balance);
    } else {
        // Reset or Handle 'Under Process' logic
        if (values.totalDeduction !== 0) form.setFieldValue('totalDeduction', 0);
        
        if (values.status === 'Under Process') {
            if (values.netPayable !== totalAmt) form.setFieldValue('netPayable', totalAmt);
            if (values.balancePendingAmount !== totalAmt) form.setFieldValue('balancePendingAmount', totalAmt);
        } else {
            if (values.netPayable !== 0) form.setFieldValue('netPayable', 0);
            if (values.balancePendingAmount !== 0) form.setFieldValue('balancePendingAmount', 0);
        }
    }
  };

  // --- Form Configuration (Memoized for Defaults) ---
  const formFields = useMemo<FormField[]>(() => {
    // Helper to extract default values safely
    const getVal = (key: keyof Invoice) => editingInvoice ? editingInvoice[key] : undefined;
    const getDateVal = (key: keyof Invoice) => {
        if (!editingInvoice) return undefined;
        const val = editingInvoice[key];
        return val ? new Date(val as string) : null;
    };

    return [
    // 1-5 Selects
    { 
      fieldType: 'Select', label: 'Project', formKey: 'project', placeholder: 'Select Project', required: true, 
      options: options.projects.map(p => ({ label: p, value: p })),
      defaultSelectedOption: getVal('project') as string 
    },
    { 
      fieldType: 'Select', label: 'Mode of Project', formKey: 'modeOfProject', placeholder: 'Select Mode', required: true, 
      options: options.modes.map(m => ({ label: m, value: m })),
      defaultSelectedOption: getVal('modeOfProject') as string
    },
    { 
      fieldType: 'Select', label: 'State', formKey: 'state', placeholder: 'Select State', required: true, 
      options: options.states.map(s => ({ label: s, value: s })),
      defaultSelectedOption: getVal('state') as string
    },
    { 
      fieldType: 'Select', label: 'Bill Category', formKey: 'billCategory', placeholder: 'Select Category', required: true, 
      options: options.billCategories.map(c => ({ label: c, value: c })),
      defaultSelectedOption: getVal('billCategory') as string
    },
    { 
      fieldType: 'Select', label: 'Milestone', formKey: 'milestone', placeholder: 'Select Milestone', required: true, 
      options: options.milestones.map(m => ({ label: m, value: m })),
      defaultSelectedOption: getVal('milestone') as string
    },
    
    // 6-8 Dates & Invoice No
    { 
      fieldType: 'Text', label: 'Invoice Number', formKey: 'invoiceNumber', placeholder: 'Enter Invoice No', required: true,
      defaultTextValue: getVal('invoiceNumber') as string
    },
    { 
      fieldType: 'Date', label: 'Invoice Date', formKey: 'invoiceDate', required: true, maxDate: new Date(),
      defaultDateValue: getDateVal('invoiceDate')
    },
    { 
        fieldType: 'Date', 
        label: 'Submission Date', 
        formKey: 'submissionDate', 
        required: true, 
        maxDate: new Date(),
        disabled: (values) => !values.invoiceDate,
        minDate: (values) => values.invoiceDate as Date,
        defaultDateValue: getDateVal('submissionDate')
    },

    // 9-12 Amounts
    { 
      fieldType: 'Number', label: 'Invoice Basic Amount', formKey: 'invoiceBasicAmount', required: true, placeholder: '0.00',
      defaultNumberValue: getVal('invoiceBasicAmount') as number
    },
    { 
      fieldType: 'Select', label: 'GST Percentage', formKey: 'gstPercentageApplicable', required: true, 
      options: options.gstPercentages.map(g => ({ label: g, value: g })),
      defaultSelectedOption: getVal('gstPercentageApplicable') as string
    },
    { 
      fieldType: 'Number', label: 'Invoice GST Amount', formKey: 'invoiceGstAmount', required: true, disabled: true, 
      defaultNumberValue: (getVal('invoiceGstAmount') as number) || 0 
    },
    { 
      fieldType: 'Number', label: 'Total Amount', formKey: 'totalAmount', required: true, disabled: true, 
      defaultNumberValue: (getVal('totalAmount') as number) || 0 
    },

    // 13-15 Files (Optional when Editing)
    { 
      fieldType: 'File', label: 'Invoice Copy', formKey: 'invoiceCopy', 
      required: !editingInvoice, // Only required for new entries
      accept: 'application/pdf',
      validate: (val) => val instanceof File && val.size > 5 * 1024 * 1024 ? 'File size exceeds 5MB' : null
    },
    { 
      fieldType: 'File', label: 'Proof of Submission', formKey: 'proofOfSubmission', 
      required: !editingInvoice, 
      accept: 'application/pdf',
      validate: (val) => val instanceof File && val.size > 5 * 1024 * 1024 ? 'File size exceeds 5MB' : null 
    },
    { 
      fieldType: 'File', label: 'Supporting Documents', formKey: 'supportingDocuments', 
      required: !editingInvoice, 
      accept: 'application/pdf',
      validate: (val) => val instanceof File && val.size > 5 * 1024 * 1024 ? 'File size exceeds 5MB' : null
    },

    // 16-17 Status & Remarks
    { 
      fieldType: 'Select', label: 'Status', formKey: 'status', required: true, 
      options: options.statuses.map(s => ({ label: s, value: s })), 
      defaultSelectedOption: (getVal('status') as string) || 'Under Process' 
    },
    { 
      fieldType: 'Textarea', label: 'Remarks', formKey: 'remarks', required: false,
      defaultTextValue: getVal('remarks') as string
    },

    // 18-29 Payment Details
    { fieldType: 'Number', label: 'Passed Amount by Client', formKey: 'passedAmountByClient', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('passedAmountByClient') as number },
    { fieldType: 'Number', label: 'Retention', formKey: 'retention', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('retention') as number },
    { fieldType: 'Number', label: 'GST Withheld', formKey: 'gstWithheld', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('gstWithheld') as number },
    { fieldType: 'Number', label: 'TDS', formKey: 'tds', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('tds') as number },
    { fieldType: 'Number', label: 'GST TDS', formKey: 'gstTds', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('gstTds') as number },
    { fieldType: 'Number', label: 'BOCW', formKey: 'bocw', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('bocw') as number },
    { fieldType: 'Number', label: 'Low Depth Deduction', formKey: 'lowDepthDeduction', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('lowDepthDeduction') as number },
    { fieldType: 'Number', label: 'LD', formKey: 'ld', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('ld') as number },
    { fieldType: 'Number', label: 'SLA Penalty', formKey: 'slaPenalty', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('slaPenalty') as number },
    { fieldType: 'Number', label: 'Penalty', formKey: 'penalty', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('penalty') as number },
    { fieldType: 'Number', label: 'Other Deduction', formKey: 'otherDeduction', hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('otherDeduction') as number },
    
    // Auto-calculated Deductions
    { fieldType: 'Number', label: 'Total Deduction', formKey: 'totalDeduction', disabled: true, hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('totalDeduction') as number },
    { fieldType: 'Number', label: 'Net Payable', formKey: 'netPayable', disabled: true, hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('netPayable') as number },
    
    { fieldType: 'Number', label: 'Amount Paid by Client', formKey: 'amountPaidByClient', required: true, hidden: (v) => v.status !== 'Paid', defaultNumberValue: getVal('amountPaidByClient') as number },
    
    { 
        fieldType: 'Date', 
        label: 'Payment Date', 
        formKey: 'paymentDate', 
        required: true, 
        hidden: (v) => v.status !== 'Paid',
        maxDate: new Date(),
        minDate: (values) => {
            if (!values.submissionDate) return undefined;
            const d = new Date(values.submissionDate as Date);
            d.setDate(d.getDate() + 1);
            return d;
        },
        defaultDateValue: getDateVal('paymentDate')
    },
    
    { 
        fieldType: 'Number', 
        label: 'Balance / Pending Amount', 
        formKey: 'balancePendingAmount', 
        disabled: true, 
        defaultNumberValue: getVal('balancePendingAmount') as number,
        validate: (val, values) => {
            if (values.status === 'Paid' && Number(val) !== 0) {
                return 'Net Payable should be equal to Amount Paid by Client.';
            }
            return null;
        }
    },
  ];
  }, [options, editingInvoice]);

  return (
    <Stack gap="lg" pb="lg">
      <DashboardFilters 
        projects={options.projects}
        states={options.states}
        statuses={options.statuses}
        billCategories={options.billCategories}
        filters={filters}
        onFilterChange={setFilters}
      />

      <Paper style={{ background: "transparent" }}>
        <Group justify="end" mb="md">
          <Button leftSection={<IconFileTypeXls size={16} />} size="sm" variant="default" onClick={handleExport}>
            Export in Excel
          </Button>
          <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleOpenCreate}>
            Create Invoice
          </Button>
          {selectedRows.length > 0 && (
            <Button leftSection={<IconTrash size={16} />} size="sm" color="red" onClick={handleDeleteInvoices}>
              Delete Invoices
            </Button>
          )}
        </Group>

        <InvoiceTable 
          data={filteredInvoices} 
          dashboardTable={false} 
          sort={true} 
          actions={true} 
          multiSelection={true} 
          selection={selectedRows}
          onSelectionChange={setSelectedRows}
          onEdit={handleEditInvoice} // 👈 Pass the edit handler
        />
      </Paper>

      <FormModal
        title={editingInvoice ? "Edit Invoice" : "Create New Invoice"} // 👈 Dynamic Title
        opened={drawerOpened}
        onClose={closeDrawer}
        submitButtonText={editingInvoice ? "Update" : "Create"} // 👈 Dynamic Button Text
        loading={submitting}
        setLoading={setSubmitting}
        formFields={formFields}
        onSubmit={handleSaveInvoice}
        onSuccess={() => closeDrawer()}
        onValuesChange={handleFormValuesChange}
        size="lg"
      />
    </Stack>
  );
};

export default Invoices;