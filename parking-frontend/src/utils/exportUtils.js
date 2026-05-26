import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'report') => {
    if (!data) {
        console.warn('No data to export');
        return;
    }

    const workbook = XLSX.utils.book_new();

    // Check if data is an array (single sheet) or object (multiple sheets)
    if (Array.isArray(data)) {
        if (data.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ReportData');
    } else {
        // Data is an object where keys are sheet names and values are arrays
        Object.keys(data).forEach(sheetName => {
            const sheetData = data[sheetName];
            if (Array.isArray(sheetData) && sheetData.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            }
        });
    }

    if (workbook.SheetNames.length === 0) {
        console.warn('No valid sheets to export');
        return;
    }

    // Create a Blob from the workbook and trigger download
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
