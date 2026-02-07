> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Send an Outbound Transfer

> Learn how to send USDC from a user-controlled wallet you've already created.

This guide outlines initiating a currency transfer from a previously created
user-controlled wallet. If you have not yet created a user-controlled wallet, go
to
[this guide](/wallets/user-controlled/create-your-first-wallet-with-social-logins).
If you do not have any tokens in your wallet, go to the
[inbound transfer](/wallets/user-controlled/receive-inbound-transfer) guide.

Note that if you're building with the [Signing API](/wallets/signing-apis), you
must manage the transaction broadcasting and indexing with your blockchain
infrastructure.

The following steps utilize Circle's sample applications in combination with API
requests that can be done via Circle's API references or cURL requests. cURL
request will be provided inline, while API references will be linked from the
API endpoint code text. You can find instructions on using it in the
[testing via the reference pages](/api-reference) guide.

## 1. Run Sample App

Once you have one of the web, iOS, or Android
[sample applications](/sample-projects) set up locally, you will then:

1. Run the sample app and simulator.
2. Obtain your App ID. This can be done by one of two options
   1. Access the developer console and navigate to the
      [configurator](https://console.circle.com/wallets/user/configurator)
      within user-controlled wallets. From there, copy the App ID.
   2. Make an API request to `GET /config/entity`

      and copy the App ID from the response body.
3. Add the App ID to the sample app.

## 2. Acquire a Session Token

You will start by making a request to
[`POST /users/token`](/api-reference/wallets/user-controlled-wallets/get-user-token)
using a previously created user ID. The `userToken` is a 60-minute session token
to initiate requests requiring a user challenge (PIN code entry). After 60
minutes, the session expires, and a new `userToken` must be generated via the
same endpoint.

From this response, you will acquire the `encryptionKey` and `userToken` which
you should provide in the respective sample app fields. Additionally, you will
use the `userToken` in Step 3.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  // Import and configure the user-controlled wallet SDK
  const {
    initiateUserControlledWalletsClient,
  } = require("@circle-fin/user-controlled-wallets");
  const circleUserSdk = initiateUserControlledWalletsClient({
    apiKey: "<API_KEY>",
  });

  const response = await circleUserSdk.createUserToken({
    userId: "2f1dcb5e-312a-4b15-8240-abeffc0e3463",
  });
  ```

  ```coffeescript Python SDK theme={null}
  import uuid

  from circle.web3 import user_controlled_wallets
  from circle.web3 import utils

  client = utils.init_user_controlled_wallets_client(api_key="Your API KEY")

  # create an api instance
  api_instance = user_controlled_wallets.UsersAndPinsApi(client)
  # get user token
  try:
      request = user_controlled_wallets.GenerateUserTokenRequest.from_dict({"userId": "<USER_ID>"})
      response = api_instance.get_user_token(request)
      print(response)
  except user_controlled_wallets.ApiException as e:
      print("Exception when calling UsersAndPinsApi->get_user_token: %s\n" % e)
  ```

  ```curl Curl theme={null}
  curl --request POST \
       --url 'https://api.circle.com/v1/w3s/users/token' \
       --header 'accept: application/json' \
       --header 'content-type: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --data '
  {
    "userId": "2f1dcb5e-312a-4b15-8240-abeffc0e3463"
  }
  '
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "userToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCC9.eyJkZXZlbG9wZXJFbnRpdHlFbnZpcm9ubWVudCI6IlRFU1QiLCJlbnRpdHlJZCI6IjRlMDdhOGM5LTIxOTAtNDVlNC1hNjc0LWQyMGFkNjg4MWI3YyIsImV4cCI6MTY5MDU1MjcwNywiaWF0IjoxNjkwNTQ5MTA3LCJpbnRlcm5hbFVzZXJJZCI6ImQ2ZjkzODliLWQ5MzUtNWFlYy1iOTVhLWNjNTk1NjA2YWM5NiIsImlzcyI6Imh0dHBzOi8vcHJvZ3JhbW1hYmxlLXdhbGxldC5jaXJjbGUuY29tIiwianRpIjoiMmE0YmJlMzAtZTdkZi00YmM2LThiODMtNTk0NGUyMzE2ODlkIiwic3ViIjoiZXh0X3VzZXJfaWRfOSJ9.dhfByhxZFbJx0XWlzxneadT4RQWdnxLu3FSN9ln65hCDOfavaTL1sc4h-jUR8i4zMmfdURw3FFcQIdSbm-BUg6M7FP_fp-cs9xBbNmRZa31gMd1aKdcajJ9SvlVrfUowYfGXM3VcNF8rtTFtW-gk1-KzU4u10U35XXbbMcW1moxE0Rqx_fKotDgk2VdITuuds5d5TiQzAXECqeCOCtNoDKktMkglltbnLxOaRl2ReZjGt-ctD2V0DbYNO4T_ndPSUDI6qD7dXQRed5uDcezJYoha3Qj3tFGBglEnox2Y6DWTbllqjwmfTGrU8Pr0yz4jQz7suGwmiCzHPxcpYxMzYQ",
    "encryptionKey": "Tlcyxz7Ts9ztRLQq5+pic0MIETblYimOo2d7idV/UFM="
  }
}
```

## 3. Check the Wallet Balance and Acquire the Token ID

Before making an outbound transfer, you must gather the token's ID and ensure
you are holding a token balance. To do this, make a request to
[`GET /wallets`](/api-reference/wallets/developer-controlled-wallets/get-wallets)
passing in the wallets `userToken` to get the `walletId`.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  const response = await circleUserSdk.listWallets({
    userToken: "<USER_TOKEN>",
    pageSize: 10,
  });
  ```

  ```coffeescript Python SDK theme={null}
  # create an api instance
  api_instance = user_controlled_wallets.WalletsApi(client)
  # list wallets
  try:
      response = api_instance.list_wallets("<USER_TOKEN>")
      print(response)
  except user_controlled_wallets.ApiException as e:
      print("Exception when calling WalletsApi->list_wallets: %s\n" % e)
  ```

  ```curl Curl theme={null}
  curl --request GET \
       --url 'https://api.circle.com/v1/w3s/wallets?pageSize=10' \
       --header 'accept: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --header 'X-User-Token: <USER_TOKEN>'
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "wallets": [
      {
        "id": "01899cf2-d415-7052-a207-f9862157e546",
        "state": "LIVE",
        "walletSetId": "01899cf2-d407-7f89-b4d9-84d63573f138",
        "custodyType": "ENDUSER",
        "userId": "2f1dcb5e-312a-4b15-8240-abeffc0e3463",
        "address": "0x075e62c80e55d024cfd8fd4e3d1184834461db57",
        "addressIndex": 0,
        "blockchain": "MATIC-AMOY",
        "accountType": "SCA",
        "updateDate": "2023-07-28T14:41:47Z",
        "createDate": "2023-07-28T14:41:47Z"
      }
    ]
  }
}
```

Next, you will make a request to
[`GET /wallet/{id}/balances`](/api-reference/wallets/user-controlled-wallets/list-wallet-balance)
to check the balance of tokens and acquire the `tokenId` you intend to transfer.
The token ID will be used in the following steps.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  const response = await circleUserSdk.getWalletTokenBalance({
    userToken: "<USER_TOKEN>",
    walletId: "<WALLET_ID>",
  });
  ```

  ```coffeescript Python SDK theme={null}
  # create an api instance
  api_instance = user_controlled_wallets.WalletsApi(client)
  try:
      response = api_instance.list_wallet_ballance("<USER_TOKEN>", "<WALLET_ID>")
      print(response)
  except user_controlled_wallets.ApiException as e:
      print("Exception when calling WalletsApi->list_wallet_ballance: %s\n" % e)
  ```

  ```curl Curl theme={null}
  curl --request GET \
       --url 'https://api.circle.com/v1/w3s/wallets/{id}/balances' \
       --header 'accept: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --header 'X-User-Token: <USER_TOKEN>'
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "tokenBalances": [
      {
        "token": {
          "id": "36b6931a-873a-56a8-8a27-b706b17104ee",
          "blockchain": "MATIC-AMOY",
          "tokenAddress": "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
          "standard": "ERC20",
          "name": "USDC",
          "symbol": "USDC",
          "decimals": 6,
          "isNative": false,
          "updateDate": "2024-03-27T17:55:12Z",
          "createDate": "2024-03-27T17:55:12Z"
        },
        "amount": "10",
        "updateDate": "2024-04-16T15:52:23Z"
      }
    ]
  }
}
```

## 4. Estimate the Cost of Transferring the token (Optional)

To estimate the fees for the transaction to transfer tokens, make a request to
[`POST transactions/transfer/estimateFee`](/api-reference/wallets/user-controlled-wallets/create-transfer-estimate-fee).

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  const response = await circleUserSdk.estimateTransferFee({
    userToken: "<USER_TOKEN>",
    amount: [".01"],
    destinationAddress: "0xEb9614D6d001391e22dDbbEA7571e9823A469c1f",
    tokenId: "36b6931a-873a-56a8-8a27-b706b17104ee",
    walletId: "01899cf2-d415-7052-a207-f9862157e546",
  });
  ```

  ```coffeescript Python SDK theme={null}
  # create an api instance
  api_instance = user_controlled_wallets.TransactionsApi(client)
  # get user token
  try:
      request = user_controlled_wallets.EstimateTransferTransactionFeeRequest.from_dict({
          "userToken": '<USER_TOKEN>',
          "amounts": ['.01'],
          "destinationAddress": '0xEb9614D6d001391e22dDbbEA7571e9823A469c1f',
          "tokenId": '36b6931a-873a-56a8-8a27-b706b17104ee',
          "walletId": '01899cf2-d415-7052-a207-f9862157e546'
      })
      response = api_instance.create_transfer_estimate_fee("<USER_TOKEN>", request)
      print(response)
  except user_controlled_wallets.ApiException as e:
      print("Exception when calling TransactionsApi->create_transfer_estimate_fee: %s\n" % e)
  ```

  ```curl Curl theme={null}
  curl --request POST \
       --url 'https://api.circle.com/v1/w3s/transactions/transfer/estimateFee' \
       --header 'accept: application/json' \
       --header 'content-type: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --header 'X-User-Token: <USER_TOKEN>' \
       --data '
  {
    "amounts": [".01"],
    "destinationAddress": "0xEb9614D6d001391e22dDbbEA7571e9823A469c1f",
    "tokenId": "38f2ad29-a77b-5a44-be05-8d03923878a2",
    "walletId": "01899cf2-d415-7052-a207-f9862157e546"
  }
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "low": {
      "gasLimit": "21000",
      "baseFee": "2.456220277",
      "priorityFee": "1.022783914",
      "maxFee": "5.935224468"
    },
    "medium": {
      "gasLimit": "21000",
      "baseFee": "2.456220277",
      "priorityFee": "2.655282857",
      "maxFee": "7.567723411"
    },
    "high": {
      "gasLimit": "21000",
      "baseFee": "2.456220277",
      "priorityFee": "15.986229693",
      "maxFee": "20.898670247"
    }
  }
}
```

## 5. Initiate a Blockchain Transfer

Make a request to
[`POST /user/transactions/transfer`](/api-reference/wallets/user-controlled-wallets/create-user-transaction-transfer-challenge)
to initiate a blockchain transfer from a specified`walletId` to a blockchain
address`destinationAddress`. This call returns a `challengeId`, used within the
sample app, that prompts users to enter their PIN code to authorize the
transfer.

<Note>
  If you do not have a wallet to use as a destination for the transfer, you can
  create another User-Controlled Wallet by stepping through [create your first
  wallet](/wallets/user-controlled/react-native-sdk-ui-customization-api) or
  send funds to any other blockchain wallet such as
  [Metamask](https://metamask.io/).
</Note>

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  const response = await circleUserSdk.createTransaction({
    userToken: "<USER_TOKEN>",
    amounts: [".01"],
    destinationAddress: "0x6E5eAf34c73D1CD0be4e24f923b97CF38e10d1f3",
    tokenId: "36b6931a-873a-56a8-8a27-b706b17104ee",
    walletId: "01899cf2-d415-7052-a207-f9862157e546",
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
  });
  ```

  ```coffeescript Python SDK theme={null}
  try:
      request = user_controlled_wallets.CreateTransferTransactionForEndUserRequest.from_dict({
          "idempotencyKey": str(uuid.uuid4()),
          "userToken": '<USER_TOKEN>',
          "amounts": ['.01'],
          "destinationAddress": '0x6E5eAf34c73D1CD0be4e24f923b97CF38e10d1f3',
          "tokenId": '36b6931a-873a-56a8-8a27-b706b17104ee',
          "walletId": '01899cf2-d415-7052-a207-f9862157e546',
          "fee": {
              "type": 'level',
              "config": {
              "feeLevel": 'MEDIUM'
              }
          }
      })
      response = api_instance.create_user_transaction_transfer_challenge("<USER_TOKEN>", request)
      print(response)
  except user_controlled_wallets.ApiException as e:
      print("Exception when calling TransactionsApi->create_transfer_estimate_fee: %s\n" % e)
  ```

  ```curl Curl theme={null}
  curl --request POST \
       --url 'https://api.circle.com/v1/w3s/user/transactions/transfer' \
       --header 'Content-Type: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --header 'X-User-Token: <USER_TOKEN>' \
       --data '
  {
    "userId": "2f1dcb5e-312a-4b15-8240-abeffc0e3463",
    "idempotencyKey": "607a0972-17f9-4d56-8ca3-a0e94adc3210",
    "amounts": [".01"],
    "destinationAddress": "0x6E5eAf34c73D1CD0be4e24f923b97CF38e10d1f3",
    "tokenId": "38f2ad29-a77b-5a44-be05-8d03923878a2",
    "walletId": "01899cf2-d415-7052-a207-f9862157e546",
    "feeLevel": "MEDIUM"
  }'
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "challengeId": "0d1b5f41-1381-50af-983b-f54691415158"
  }
}
```

## 6. Authorize transfer from the sample app

Using the sample application, enter the `userToken` and `secretKey` returned
from Step 2. Also, enter the `challengeId` returned from Step 5.

At this point, you should be ready to execute your first transfer through the
sample app. Click **Execute** in the sample app to continue.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=690d72a590be6a758d436d33e4dac5c8" data-og-width="375" width="375" data-og-height="812" height="812" data-path="w3s/images/ucw-saot-sampleapp01.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?w=280&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=ed423ac408e99cfa3aedbdde62a488ba 280w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?w=560&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=8b6713be26e45349631141fc34cf2aea 560w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?w=840&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=c551858086f78d1d27cbf622c70de4e9 840w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?w=1100&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=26e103cb754a72d2423cbbbc53568ebd 1100w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?w=1650&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=5eb6b2d13a424ad3a3649a28601fcc2b 1650w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp01.png?w=2500&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=7e3d9d4a18d53f800ef0ce38ee981a05 2500w" />
</Frame>

The sample application takes you through the authentication process, which
includes the user entering their PIN code to authorize the transfer.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=5ed9bafef67c187bf67e57eaee9f2d94" data-og-width="924" width="924" data-og-height="1999" height="1999" data-path="w3s/images/ucw-saot-sampleapp02.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?w=280&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=94280da3fdb07dc27c3d885c75c00b16 280w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?w=560&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=8a57c018f00f400a3f694f7938047632 560w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?w=840&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=3b3c63217c57f54f3983c7c8cc600134 840w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?w=1100&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=f58868a81b37c5ee8c8d7f38cfd3a3cf 1100w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?w=1650&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=d904627dae1b9e45c48aa22b56455a2c 1650w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-saot-sampleapp02.png?w=2500&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=3418b1264b51adf88d850b316440ba92 2500w" />
</Frame>

## 7. Check the Transfer Status

As the transfer `state` changes and ultimately completes, Circle sends
notifications to a [subscribed endpoint](/wallets/webhook-notifications). You
can find a list of all possible states in the
[Asynchronous States and Statuses guide](/w3s/asynchronous-states-and-statuses).
The Webhook notification will be similar to the one below.

```json Webhook Request Body theme={null}
{
  "subscriptionId": "d4c07d5f-f05f-4fe4-853d-4dd434806dfb",
  "notificationId": "acab8c14-92ae-481a-8335-6eb5271da014",
  "notificationType": "transactions.outbound",
  "notification": {
    "id": "ad3f40ae-9c0e-52cf-816f-91838850572a",
    "blockchain": "MATIC-AMOY",
    "tokenId": "36b6931a-873a-56a8-8a27-b706b17104ee",
    "walletId": "01899cf2-d415-7052-a207-f9862157e546",
    "sourceAddress": "0x7b777eb80e82f73f118378b15509cb48cd2c2ac3",
    "destinationAddress": "0x6e5eaf34c73d1cd0be4e24f923b97cf38e10d1f3",
    "transactionType": "OUTBOUND",
    "custodyType": "ENDUSER",
    "state": "COMPLETE",
    "amounts": ["0.01"],
    "nfts": null,
    "txHash": "0x535ff240984f54e755d67cdc9c79c88768fe5997955f09f3a66b4d1126810900",
    "blockHash": "0xa4c5c79500240f3ae3f4e5c5f641198b7c698d83b7539ac4e8cf2d3f5f49bdfd",
    "blockHeight": 41100000,
    "networkFee": "0.07037500047405219",
    "firstConfirmDate": "2023-10-11T21:08:28Z",
    "operation": "TRANSFER",
    "userId": "c266945c-f440-4537-85cf-a16b6e33b0cc",
    "abiParameters": null,
    "createDate": "2023-10-11T21:08:13Z",
    "updateDate": "2023-10-11T21:08:37Z"
  },
  "timestamp": "2023-10-11T21:08:13Z",
  "version": 2
}
```

Alternatively, you can poll
[`GET /transactions`](/api-reference/wallets/user-controlled-wallets/list-transactions)
using the `userId` or `userToken` associated with your user.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
  const response = await circleUserSdk.listTransactions({
    userToken: "<USER_TOKEN>",
  });
  ```

  ```coffeescript Python SDK theme={null}
  # create an api instance
  api_instance = user_controlled_wallets.TransactionsApi(client)
  # get user token
  try:
      response = api_instance.list_transactions("<USER_TOKEN>")
      print(response)
  except user_controlled_wallets.ApiException as e:
      print("Exception when calling TransactionsApi->list_transactions: %s\n" % e)
  ```

  ```curl Curl theme={null}
  curl --request GET \
       --url 'https://api.circle.com/v1/w3s/transactions' \
       --header 'accept: application/json' \
       --header 'content-type: application/json' \
       --header 'authorization: Bearer <API_KEY>' \
       --header 'X-User-Token: <USER_TOKEN>'
  ```
</CodeGroup>

```json Response Body theme={null}
{
  "data": {
    "transactions": [
      {
        "id": "ad3f40ae-9c0e-52cf-816f-91838850572a",
        "blockchain": "MATIC-AMOY",
        "tokenId": "36b6931a-873a-56a8-8a27-b706b17104ee",
        "walletId": "01899cf2-d415-7052-a207-f9862157e546",
        "sourceAddress": "0x7b777eb80e82f73f118378b15509cb48cd2c2ac3",
        "destinationAddress": "0x6e5eaf34c73d1cd0be4e24f923b97cf38e10d1f3",
        "transactionType": "OUTBOUND",
        "custodyType": "ENDUSER",
        "state": "COMPLETE",
        "amounts": ["0.01"],
        "nfts": null,
        "txHash": "0x535ff240984f54e755d67cdc9c79c88768fe5997955f09f3a66b4d1126810900",
        "blockHash": "0xa4c5c79500240f3ae3f4e5c5f641198b7c698d83b7539ac4e8cf2d3f5f49bdfd",
        "blockHeight": 41100000,
        "networkFee": "0.07037500047405219",
        "firstConfirmDate": "2023-10-11T21:08:28Z",
        "operation": "TRANSFER",
        "userId": "c266945c-f440-4537-85cf-a16b6e33b0cc",
        "abiParameters": null,
        "createDate": "2023-10-11T21:08:13Z",
        "updateDate": "2023-10-11T21:08:37Z"
      },
      {
        "id": "81cf790a-ed95-5d41-b7bd-c4e15390eef6",
        "blockchain": "MATIC-AMOY",
        "tokenId": "36b6931a-873a-56a8-8a27-b706b17104ee",
        "walletId": "01899cf2-d415-7052-a207-f9862157e546",
        "sourceAddress": "0x48520ff9b32d8b5bf87abf789ea7b3c394c95ebe",
        "destinationAddress": "0x7b777eb80e82f73f118378b15509cb48cd2c2ac3",
        "transactionType": "INBOUND",
        "custodyType": "ENDUSER",
        "state": "COMPLETE",
        "amounts": ["10"],
        "nfts": null,
        "txHash": "0x5121f9efec29d4d661ffb0b777727d1f5ba7b5bc286ac4891c82f7b1b80a9485",
        "blockHash": "0xba7984dbe7423827b5fd175a636552ae85401c3f2a0c5cdda934a37d6652ac49",
        "blockHeight": 41098635,
        "networkFee": "0.001911870000955935",
        "firstConfirmDate": "2023-10-11T20:13:33Z",
        "operation": "TRANSFER",
        "userId": "c266945c-f440-4537-85cf-a16b6e33b0cc",
        "abiParameters": null,
        "createDate": "2023-10-11T20:13:33Z",
        "updateDate": "2023-10-11T20:13:45Z"
      }
    ]
  }
}
```
