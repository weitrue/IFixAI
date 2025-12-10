import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import { chatWithAgent, AgentType } from '../services/ai-agents';

const router = express.Router();

// Create Excel file with AI assistance
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { description, filename, agentType } = req.body;

    if (!description || !filename) {
      return res.status(400).json({ error: 'Description and filename are required' });
    }

    // Use AI to generate Excel structure
    const prompt = `请帮我创建一个Excel文件，需求描述：${description}\n\n请返回JSON格式，包含：\n- headers: 表头数组\n- data: 数据行数组（每行是一个数组）\n- styles: 样式配置（可选）`;

    const response = await chatWithAgent(agentType || 'gemini', [
      { role: 'user', content: prompt },
    ]);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    const excelData = JSON.parse(response.content);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Add headers
    if (excelData.headers) {
      worksheet.addRow(excelData.headers);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Add data
    if (excelData.data) {
      excelData.data.forEach((row: any[]) => {
        worksheet.addRow(row);
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze Excel file
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { fileBuffer, questions, agentType } = req.body;

    if (!fileBuffer || !questions) {
      return res.status(400).json({ error: 'File buffer and questions are required' });
    }

    // Parse Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(fileBuffer));

    // Extract data
    const data: any = {};
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell((cell, colNumber) => {
          rowData.push(cell.value);
        });
        sheetData.push(rowData);
      });
      data[worksheet.name] = sheetData;
    });

    // Use AI to analyze
    const prompt = `请分析以下Excel数据并回答这些问题：${questions}\n\n数据：\n${JSON.stringify(data, null, 2)}`;

    const response = await chatWithAgent(agentType || 'gemini', [
      { role: 'user', content: prompt },
    ]);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    res.json({ analysis: response.content, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Beautify Excel file
router.post('/beautify', async (req: Request, res: Response) => {
  try {
    const { fileBuffer, filename, agentType } = req.body;

    if (!fileBuffer || !filename) {
      return res.status(400).json({ error: 'File buffer and filename are required' });
    }

    // Parse Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(fileBuffer));

    // Extract current structure
    const structure: any = {};
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell((cell, colNumber) => {
          rowData.push(cell.value);
        });
        sheetData.push(rowData);
      });
      structure[worksheet.name] = sheetData;
    });

    // Use AI to suggest beautification
    const prompt = `请美化以下Excel文件，使其更加专业和易读。数据：\n${JSON.stringify(structure, null, 2)}\n\n请返回JSON格式，包含样式建议。`;

    const response = await chatWithAgent(agentType || 'gemini', [
      { role: 'user', content: prompt },
    ]);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    const styles = JSON.parse(response.content);

    // Apply styles
    workbook.eachSheet((worksheet) => {
      // Apply header styles
      if (worksheet.getRow(1)) {
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, size: 12 };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Auto-fit columns
      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

