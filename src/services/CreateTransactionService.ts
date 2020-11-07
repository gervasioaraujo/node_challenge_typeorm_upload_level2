import { getRepository, getCustomRepository } from 'typeorm';
//
import AppError from '../errors/AppError';
import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {

  public async execute({ title, value, type, category }: Request): Promise<Transaction> {

    const categoryRepository = getRepository(Category);
    let transactionCategory = await categoryRepository.findOne({ title: category });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(transactionCategory);
    }

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type property accepts only income or outcome values.');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();
    if (type === 'outcome' && balance.total < value) {
      throw new AppError("Invalid outcome value: you don't have enough balance.");
    }

    const transaction = transactionsRepository.create({
      title, value, type,
      category_id: transactionCategory.id
    });

    await transactionsRepository.save(transaction);

    return transaction;

  }

}

export default CreateTransactionService;
