import fs from 'fs';
import csv from 'csv-parse';
//
import Transaction from '../models/Transaction';
import CreateTransactionService from '../services/CreateTransactionService';
import AppError from '../errors/AppError';

interface ImportedTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {

  private async readTransactionsFromCSVFile(filePath: string): Promise<ImportedTransaction[]> {

    return new Promise((resolve, reject) => {

      const importedTransactions: ImportedTransaction[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {

          if (row.includes('')) {
            reject('Invalid csv file format.');
          }

          const invalidRow = ['title', 'type', 'value', 'category'];

          JSON.stringify(row) === JSON.stringify(invalidRow)

          if (JSON.stringify(row) !== JSON.stringify(invalidRow)) {
            const transaction = {
              title: row[0],
              type: row[1],
              value: parseFloat(row[2]),
              category: row[3]
            }
            importedTransactions.push(transaction);
          }

        })
        .on('end', async () => {
          resolve(importedTransactions);
        });

    });

  }

  public async execute(filePath: string): Promise<Transaction[]> {

    try {

      const importedTransactions = await this.readTransactionsFromCSVFile(filePath);

      // Deletar arquivo
      const userAvatarFileExists = await fs.promises.stat(filePath);
      if (userAvatarFileExists) {
        await fs.promises.unlink(filePath);
      }

      const createTransactionService = new CreateTransactionService();

      const transactions = await Promise.all(
        importedTransactions.map(async transaction => {
          const { title, type, value, category } = transaction;
          return await createTransactionService.execute({ title, value, type, category });
        })
      );

      return transactions;

    } catch (error) {
      throw new AppError(error);
    }

  }

}

export default ImportTransactionsService;
