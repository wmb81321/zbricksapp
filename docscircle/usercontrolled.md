> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting Started with the User-Controlled Wallets Node.js SDK

Use the
[Node.js SDK](https://www.npmjs.com/package/@circle-fin/user-controlled-wallets)
to interact with Circle's User-Controlled Wallet APIs, which allow you to embed
secure wallets in your applications and create blockchain transactions using the
Developer Services platform.

This page provides short examples of how to install and use the user-controlled
wallets SDK. For complete examples, see the [Sample Projects](/sample-projects)
page. For more information see the
[user-controlled wallets documentation](/wallets/user-controlled).

## Prerequisites

To use the Node.js SDK, ensure you have:

* [Node.js v22+](https://nodejs.org/) installed
* A [Circle Developer Console](https://console.circle.com) account
* An [API key](/w3s/keys) created in the Console:\
  **Keys → Create a key → API key → Standard Key**
* Your
  [Entity Secret registered](https://developers.circle.com/wallets/dev-controlled/register-entity-secret)

## Install the SDK

Use the following commands to install the SDK. You can
[view the package information on the npm site](https://www.npmjs.com/package/@circle-fin/user-controlled-wallets).

<CodeGroup>
  ```shell npm theme={null}
  npm install @circle-fin/user-controlled-wallets --save
  ```

  ```shell yarn theme={null}
  yarn add @circle-fin/user-controlled-wallets
  ```
</CodeGroup>

## User-controlled wallets client

To start using the SDK, you first need to configure a client. Import the
`initiateUserControlledWalletsClient` factory from the SDK, and then initialize
the client using your API key.

### Import the client

The following example shows how to import the client and configure it to use
your API key:

<CodeGroup>
  ```ts ES Module theme={null}
  import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
  const client = initiateUserControlledWalletsClient({
    apiKey: "<your-api-key>",
  });
  ```

  ```ts CommonJS theme={null}
  const {
    initiateUserControlledWalletsClient,
  } = require("@circle-fin/user-controlled-wallets");
  const client = initiateUserControlledWalletsClient({
    apiKey: "<your-api-key>",
  });
  ```
</CodeGroup>

## Create a transaction

The following example shows how to create a transaction using the client:

```javascript  theme={null}
const response = await client.createTransaction({
  userToken: "dummy-user-token",
  amounts: ["0.01"],
  destinationAddress: "0xa51c9c604b79a0fadbfed35dd576ca1bce71da0a",
  tokenId: "738c8a6d-8896-46d1-b2cb-083600c1c69b",
  walletId: "a635d679-4207-4e37-b12e-766afb9b3892",
  fee: {
    type: "level",
    config: {
      feeLevel: "HIGH",
    },
  },
});
console.log(response.data?.challengeId);
```

## Client configuration options

The client for the user-controlled wallets SDK accepts the following
configuration parameters:

| **Option** | **Required?** | **Description**                                                                                        |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `apiKey`   | Yes           | The API key used to authenticate requests to the Circle API.                                           |
| `storage`  | No            | Optional custom storage solution for persisting data. If not provided, the SDK uses in-memory storage. |
