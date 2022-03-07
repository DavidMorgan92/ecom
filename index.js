require('dotenv').config();
const app = require('./server');

// Server listens on this port
const PORT = process.env.PORT || 4001;

// Start listening
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
