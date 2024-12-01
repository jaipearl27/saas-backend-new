import { parentPort, workerData } from 'worker_threads';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

(async () => {
  try {
    const { data, columns } = workerData;

    if (!data || !Array.isArray(data) || !columns || !Array.isArray(columns)) {
      throw new Error('Invalid data or columns received in worker');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20, 
    }));

    worksheet.addRows(data);

    const filePath = path.resolve(`./exports/data_${Date.now()}.xlsx`);

    await workbook.xlsx.writeFile(filePath);

    parentPort.postMessage({ success: true, filePath });
  } catch (error) {
    console.error('Worker encountered an error:', error.message);
    parentPort.postMessage({ success: false, error: error.message });
  }
})();
