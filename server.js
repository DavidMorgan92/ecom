const express = require('express');

// Server listens on this port
const PORT = process.env.PORT || 4001;

// Create server
const app = express();

// Start listening
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// Export server
module.exports = app;
