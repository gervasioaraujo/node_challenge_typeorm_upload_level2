import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {

  public async getBalance(): Promise<Balance> {

    const incomes = await this.find({ type: 'income' });
    const outcomes = await this.find({ type: 'outcome' });

    const balance = {
      income: incomes.reduce((total, income) => {
        return total + income.value
      }, 0),
      outcome: outcomes.reduce((total, outcome) => {
        return total + outcome.value
      }, 0),
      total: 0
    };

    balance.total = balance.income - balance.outcome;

    return balance;

  }

}

export default TransactionsRepository;
