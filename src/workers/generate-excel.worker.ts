import { parentPort, workerData } from 'worker_threads';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

(async () => {
  try {
    const { data, columns, filePath, isKey=false } = workerData;
    console.log('in worker');

    if (!Array.isArray(data) || !Array.isArray(columns)) {
      throw new Error('Invalid data or columns received in worker');
    }

    let newColumns = columns;
    let maxPhoneColumns = 0;

    if (
      columns.some(({ key }) => key === 'phone') &&
      data.some(
        ({ phoneDetails }) =>
          Array.isArray(phoneDetails) && phoneDetails.length,
      )
    ) {
      data.forEach((item) => {
        item.phoneDetails?.forEach(
          ({ _id }: { _id: string }, index: number) => {
            item[`phone-${index + 1}`] = _id;
            maxPhoneColumns = Math.max(index + 1, maxPhoneColumns);
          },
        );
      });

      const phoneColumns = Array.from(
        { length: maxPhoneColumns },
        (_, index) => ({
          key: `phone-${index + 1}`,
          header: `Phone ${index + 1}`,
          width: 20,
        }),
      );

      newColumns = [
        ...columns.filter(({ key }) => key !== 'phone'),
        ...phoneColumns,
      ];
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = newColumns.map((col) => ({
      header: isKey 
        ? col.header
            .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        : col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // Apply bold style to header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    worksheet.addRows(data);

    const tempfilePath = filePath
      ? path.resolve(filePath)
      : path.resolve(`./exports/data_${Date.now()}.xlsx`);
    
      console.log(" ------- > ",tempfilePath);
    

    await workbook.xlsx.writeFile(tempfilePath);

    // Get file stats
    const stats = fs.statSync(tempfilePath);
    
    parentPort.postMessage({ 
      success: true,
      filePath: tempfilePath,
      fileSize: stats.size,
    });
  } catch (error) {
    console.error('Worker encountered an error:', error.message);
    parentPort.postMessage({ success: false, error: error.message });
  }
})();
