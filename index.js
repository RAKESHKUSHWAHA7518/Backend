// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error(err));

// // Cart Item Schema & Model
// const cartItemSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   price: { type: Number, required: true },
//   quantity: { type: Number, required: true },
// });
// const CartItem = mongoose.model('CartItem', cartItemSchema);

// app.get('/', (req, res) => {
//     res.send('Welcome to the Homepage!');
//   });
// // Routes
// // Add a product to cart
// app.post('/cart/add', async (req, res) => {
//   try {
//     const { name, price, quantity } = req.body;
//     const item = new CartItem({ name, price, quantity });
//     await item.save();
//     res.status(201).json(item);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // View all cart items
// app.get('/cart', async (_req, res) => {
//   try {
//     const items = await CartItem.find();
//     res.json(items);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Remove a product by ID
// app.delete('/cart/remove/:id', async (req, res) => {
//   try {
//     await CartItem.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Item removed' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Calculate total price
// app.get('/cart/total', async (_req, res) => {
//   try {
//     const items = await CartItem.find();
//     const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
//     res.json({ total });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Server listen
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// // import express from 'express';
// const express = require('express');
// // import crypto from 'crypto';
// const crypto = require('crypto')
// // import cors from 'cors';
// const cors = require('cors')
// const app = express();
// const port = 5000;

// // Enable CORS
// app.use(cors());
// app.use(express.json());

// const ALGORITHM = 'aes-128-cbc';

// app.post('/generate-hash', (req, res) => {
//   try {
//     const { password, secret, till } = req.body;

//     if (!password || !secret || !till) {
//       return res.status(400).json({
//         status: false,
//         error: 'Missing required parameters: password, secret, and till are required'
//       });
//     }

//     // Generate a 16-byte random initialization vector (IV)
//     const iv = crypto.randomBytes(16);
    
//     // Create plaintext in the format "till.password"
//     const plaintext = `${till}.${password}`;
    
//     // Create a cipher using the secret key and the IV in AES-128-CBC mode
//     const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secret, 'hex'), iv);
    
//     // Encrypt the text (with padding) and combine output parts
//     const encryptedText = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
    
//     // Return a string in the format "iv_hex.encryptedText_hex"
//     const hash = iv.toString('hex') + '.' + encryptedText;

//     res.json({
//       status: true,
//       response: {
//         hash,
//         till
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       error: error.message
//     });
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Welcome to the Homepage!');
// });

// app.listen(port, () => {
//   console.log(`Hash generation server running at http://localhost:${port}`);
// });


// server.js
const express = require('express');
const crypto  = require('crypto');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const port = 5000;

// Constants
const ALGORITHM         = 'aes-128-cbc';
const FANCENTRO_API_URL = 'https://fancentro.com/external';
const EMAIL             = 'vtarabcakova@gmail.com';
const PASSWORD          = '92hf83jsba&1';
const SECRET            = '75f2bd1131870721df8eb57d322e8adb';

// Enable CORS & JSON body‑parsing
app.use(cors());
app.use(express.json());

// Authentication helper
async function authenticate() {
  try {
    const till = Math.floor(Date.now() / 1000) + 3600;
    const iv    = crypto.randomBytes(16);
    const plain = `${till}.${PASSWORD}`;
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET, 'hex'), iv);
    const encrypted = cipher.update(plain, 'utf8', 'hex') + cipher.final('hex');
    const hash = iv.toString('hex') + '.' + encrypted;
console.log(EMAIL, till, hash);

    const resp = await axios.get(`${FANCENTRO_API_URL}/client.auth`, {
      params: { email: EMAIL, till, hash }
    });

    if (!resp.data.status) throw new Error(resp.data.error || 'Authentication failed');
    return resp.data.response;
  } catch (err) {
    throw new Error(`Authentication failed: ${err.message}`);
  }
}

// POST /auth → returns FanCentro auth token
app.post('/auth', async (req, res) => {
  try {
    const authToken = await authenticate();
    console.log(`Auth token: ${authToken}`);
    res.send(`Auth token: ${authToken}`);
    res.json({ status: true, response: authToken });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});
// app.get('/auth', async (req, res) => {
//   try {
//     const authToken = await authenticate();
//     console.log(`Auth token: ${authToken}`);
//     res.send(`Auth token: ${authToken}`);
//     res.json({ status: true, response: authToken });
//   } catch (err) {
//     res.status(500).json({ status: false, error: err.message });
//   }
// });
// GET /users?modelToken=… → returns contacts for that model
app.get('/users', async (req, res) => {
  try {
    const { modelToken } = req.query;
    if (!modelToken) return res.status(400).json({ status: false, error: 'Model token is required' });

    const authToken = await authenticate();
    const resp = await axios.get(`${FANCENTRO_API_URL}/chat.getContacts`, {
      params: { ct: modelToken, auth: authToken, limit: 400 }
    });

    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// GET /messages?modelToken=…&interlocutorId=… → returns chat history
app.get('/messages', async (req, res) => {
  try {
    const { modelToken, interlocutorId } = req.query;
    if (!modelToken || !interlocutorId) {
      return res.status(400).json({ status: false, error: 'Model token and interlocutor ID are required' });
    }

    const authToken = await authenticate();
    const resp = await axios.get(`${FANCENTRO_API_URL}/chat.getMessages`, {
      params: { ct: modelToken, auth: authToken, interlocutorId }
    });

    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /messages { modelToken, interlocutorId, message } → send a new chat message
app.post('/messages', async (req, res) => {
  try {
    const { modelToken, interlocutorId, message } = req.body;
    if (!modelToken || !interlocutorId || !message) {
      return res.status(400).json({ status: false, error: 'Model token, interlocutor ID, and message are required' });
    }

    const authToken = await authenticate();
    const resp = await axios.post(`${FANCENTRO_API_URL}/chat.sendMessage`, null, {
      params: {
        ct: modelToken,
        auth: authToken,
        interlocutorId,
        message: encodeURIComponent(message),
        type: 'text'
      }
    });

    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Homepage!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
