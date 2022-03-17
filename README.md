# ecom

This is the E-Commerce App Codecademy portfolio project.

## Heroku deployment

The server can be found deployed to Heroku at https://fathomless-brushlands-45761.herokuapp.com/. Navigate to https://fathomless-brushlands-45761.herokuapp.com/api-docs to see the Swagger UI.

## API documentation

Swagger UI documentation can be found by running the server and navigating to /api-docs.

A Postman collection of requests can be found in the [ecom.postman_collection.json](https://github.com/DavidMorgan92/ecom/blob/ba00de3a38b37206841b502f01c63f92bea8c8b0/ecom.postman_collection.json) file which can be imported into Postman.

## Configuration

The server uses a .env file in the root directory with a PORT value for the server's listen port, and a SESSION_SECRET value for the express-session secret key. The PORT value defaults to 4001 if one is not provided, but provide a SESSION_SECRET to run the server. You can also provide connection settings for running locally by providing PG_USER, PG_PASSWORD, PG_HOST, PG_DATABASE and PG_PORT variables.

## Future improvements

Future improvements could include but are not limited to:

1. Refactoring repeated code in the test suites.
2. Changing mocking technique in [services/__mocks\__/auth-service.js](https://github.com/DavidMorgan92/ecom/blob/c58546d810ce6a63f86320d62ba24d6c342ebac6/services/__mocks__/auth-service.js) so as not require repeating code, perhaps using [Rewire](https://www.npmjs.com/package/rewire).
3. Avoiding use of the LOWER function in the database query [here](https://github.com/DavidMorgan92/ecom/blob/c58546d810ce6a63f86320d62ba24d6c342ebac6/services/product-service.js#L70) to improve performance.
4. Implement array of secret session keys so that keys can be periodically updated without immediately invalidating old sessions.
5. Improve API error reporting.

## Next steps

I've implemented a method for creating products through the API by posting to /products. This requires the user to be logged in as an admin, so I've created a boolean is_admin column in the database in the account table. The only way to change this value is by editing the database directly. Admin users can create products but other users are not allowed to use this route.
