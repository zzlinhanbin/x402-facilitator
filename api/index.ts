import express, { Request, Response } from 'express';
import { base64 } from 'rfc4648';
import { ethers } from 'ethers';
import serverless from 'serverless-http';
import 'dotenv/config';

const app = express();
app.use(express.json());

app.get('/supported', (req: Request, res: Response) => {
  res.json({
    x402Version: 1,
    supported: [
      { scheme: 'exact', network: 'eip155:1' },
      { scheme: 'exact', network: 'eip155:11155111' },
    ],
  });
});

app.post('/verify', (req: Request, res: Response) => {
  try {
    const { paymentHeader, paymentRequirements } = req.body;
    const payload = JSON.parse(base64.parse(paymentHeader).toString());
    const { amount, asset, signature } = payload.payload;

    if (
      amount !== paymentRequirements.maxAmountRequired ||
      asset !== paymentRequirements.asset
    ) {
      return res.json({ isValid: false, invalidReason: 'Invalid amount or asset' });
    }

    const recoveredAddress = ethers.verifyMessage(
      JSON.stringify({ amount, asset }),
      signature
    );
    if (recoveredAddress !== req.get('X-PAYER')) {
      return res.json({ isValid: false, invalidReason: 'Invalid signature' });
    }

    res.json({ isValid: true, invalidReason: null });
  } catch (error) {
    res.json({ isValid: false, invalidReason: 'Invalid payment header' });
  }
});

app.post('/settle', (req: Request, res: Response) => {
  res.json({
    success: true,
    txHash: '0xMockTransactionHash',
  });
});

export default serverless(app);