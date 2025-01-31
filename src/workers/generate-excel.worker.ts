import { parentPort, workerData } from 'worker_threads';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

(async () => {
  try {
    const { data, columns } = workerData;
    console.log('in worker');

    if (!data || !Array.isArray(data) || !columns || !Array.isArray(columns)) {
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

    console.log(data, newColumns, maxPhoneColumns);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = newColumns.map((col) => ({
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
