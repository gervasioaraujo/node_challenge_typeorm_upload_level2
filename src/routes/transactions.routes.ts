import { Router } from 'express';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  return response.json({ ok: true });
});

transactionsRouter.post('/', async (request, response) => {

  const { title, value, type, category } = request.body;

  const createTransactionService = new CreateTransactionService();


  return response.json({ ok: true });

});

transactionsRouter.delete('/:id', async (request, response) => {
  return response.json({ ok: "delete" });
});

transactionsRouter.post('/import', async (request, response) => {
  return response.json({ ok: "import" });
});

export default transactionsRouter;
