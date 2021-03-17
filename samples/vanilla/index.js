// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('static'));

app.use('/dist', express.static('../../dist'));

// eslint-disable-next-line no-undef
app.listen(port, () => console.log("we're listening"));
