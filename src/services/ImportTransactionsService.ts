import fs from 'fs';
import csv from 'csv-parse';
import { getCustomRepository, getRepository } from 'typeorm';
//
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface ImportedTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_id: string;
}

class ImportTransactionsService {

  private async readTransactionsFromCSVFile(filePath: string): Promise<ImportedTransaction[]> {

    return new Promise((resolve, reject) => {

      const importedTransactions: ImportedTransaction[] = [];

      fs.createReadStream(filePath)
        .pipe(csv({ from_line: 2 }))
        .on('data', (row) => {

          if (row.includes('')) {
            reject('Invalid csv file format.');
          }

          const transaction = {
            title: row[0].trim(),
            type: row[1].trim(),
            value: parseFloat(row[2].trim()),
            category: row[3].trim()
          }

          importedTransactions.push(transaction);

        })
        .on('end', () => {
          resolve(importedTransactions);
        });

    });

  }

  private async createCategory(category: string): Promise<Category> {

    const categoryRepository = getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({ title: category });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(transactionCategory);
    }

    return transactionCategory;

  }

  private async createTransaction({ title, value, type, category_id }: TransactionDTO): Promise<Transaction> {

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type property accepts only income or outcome values.');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();
    if (type === 'outcome' && balance.total < value) {
      throw new AppError("Invalid outcome value: you don't have enough balance.");
    }

    const transaction = transactionsRepository.create({
      title, value, type, category_id
    });

    await transactionsRepository.save(transaction);

    return transaction;

  }

  public async execute(filePath: string): Promise<Transaction[]> {

    try {

      const importedTransactions = await this.readTransactionsFromCSVFile(filePath);

      // Deletar arquivo
      const userAvatarFileExists = await fs.promises.stat(filePath);
      if (userAvatarFileExists) {
        await fs.promises.unlink(filePath);
      }


      const mappedTransactions = [];
      for (let t of importedTransactions) {
        const { title, type, value, category } = t;
        const transactionCategory = await this.createCategory(category);
        const transaction = { title, value, type, category_id: transactionCategory.id }
        mappedTransactions.push(transaction);
      }

      const transactions = [];
      for (let t of mappedTransactions) {
        const { title, type, value, category_id } = t;
        const transaction = await this.createTransaction({ title, value, type, category_id });
        transactions.push(transaction);
      }

      return transactions;

    } catch (error) {
      throw new AppError(error);
    }

  }

}

export default ImportTransactionsService;
