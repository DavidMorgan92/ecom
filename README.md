# ecom

This is the E-Commerce App Codecademy portfolio project.

## API documentation

Swagger UI documentation can be found by running the server and navigating to /api-docs.

A Postman collection of requests can be found in the [ecom.postman_collection.json](https://github.com/DavidMorgan92/ecom/blob/c58546d810ce6a63f86320d62ba24d6c342ebac6/ecom.postman_collection.json) file which can be imported into Postman.

## Configuration

The server uses a .env file in the root directory with a PORT value for the server's listen port, and a SESSION_SECRET value for the express-session secret key. The PORT value defaults to 4001 if one is not provided, but provide a SESSION_SECRET to run the server.

## Future improvements

Future improvements could include but are not limited to:

1. Refactoring repeated code in the test suites.
2. Changing mocking technique in [services/__mocks\__/auth-service.js](https://github.com/DavidMorgan92/ecom/blob/c58546d810ce6a63f86320d62ba24d6c342ebac6/services/__mocks__/auth-service.js) so as not require repeating code, perhaps using [Rewire](https://www.npmjs.com/package/rewire).
3. Avoiding use of the LOWER function in the database query [here](https://github.com/DavidMorgan92/ecom/blob/c58546d810ce6a63f86320d62ba24d6c342ebac6/services/product-service.js#L70) to improve performance.
