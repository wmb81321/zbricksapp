> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting Started with the Contracts Node.js SDK

Use the
[Node.js SDK](https://www.npmjs.com/package/@circle-fin/smart-contract-platform)
to interact with [Contracts APIs](/api-reference/contracts/common/ping), which
allow you interact with smart contracts on the blockchain using the Developer
Services platform.

This page provides short examples of how to install and use the Contracts SDK.
For complete examples, see the [Sample Projects](/sample-projects) page. For
more information see the [Contracts documentation](/contracts).

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
[view the package information on the npm site](https://www.npmjs.com/package/@circle-fin/smart-contract-platform).

<CodeGroup>
  ```shell npm theme={null}
  npm install @circle-fin/smart-contract-platform --save
  ```

  ```shell yarn theme={null}
  yarn add @circle-fin/smart-contract-platform
  ```
</CodeGroup>

## Contracts client

To start using the SDK, you first need to configure a client. Import the
`initiateSmartContractPlatformClient` factory from the SDK, and then initialize
the client using your API key and entity secret.

### Import the client

The following example shows how to import the client and configure it to use
your API key and entity secret:

<CodeGroup>
  ```javascript CommonJS theme={null}
  const {
    initiateSmartContractPlatformClient,
  } = require("@circle-fin/smart-contract-platform");
  const client = initiateSmartContractPlatformClient({
    apiKey: "<your-api-key>",
    entitySecret: "<your-entity-secret>",
  });
  ```

  ```javascript ES Module theme={null}
  import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
  const client = initiateSmartContractPlatformClient({
    apiKey: "<your-api-key>",
    entitySecret: "<your-entity-secret>",
  });
  ```
</CodeGroup>

### Deploy a smart contract

The following example shows how to deploy a smart contract using the client:

```javascript  theme={null}
const response = await client.deployContract({
  name: "First Contract",
  description: "My first hello world contract",
  walletId: "004735f6-d9fc-44f8-933c-672cdf3d240d",
  abiJson:
    "[\n\t{\n\t\t'inputs': [],\n\t\t'stateMutability': 'nonpayable',\n\t\t'type': 'constructor'\n\t},\n\t...",
  bytecode: "0x60806040523480156200001157600080fd5b50604051806040...",
  constructorParameters: ["TICK", 10000],
  feeLevel: "MEDIUM",
});
console.log(response.data);
```

## Client configuration options

The client for the Contracts SDK accepts the following configuration parameters:

| **Option**     | **Required?** | **Description**                                                                                        |
| -------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `apiKey`       | Yes           | The API key used to authenticate requests to the Circle API.                                           |
| `entitySecret` | Yes           | Your configured entity secret.                                                                         |
| `storage`      | No            | Optional custom storage solution for persisting data. If not provided, the SDK uses in-memory storage. |
