> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Send an Outbound Transfer or Execute Contract

> Learn how to send USDC or execute a contract from a user-controlled wallet with social logins or email authentication

This guide outlines how to initiate a currency transfer or execute a contract
from a previously created user-controlled wallet with social logins or email
authentication. To create a wallet, see
[Create Your First Wallet with Social Logins](/wallets/user-controlled/create-your-first-wallet-with-social-logins)
or
[Create Your First Wallet with Email](/wallets/user-controlled/create-your-first-wallet-with-email).

If you're building with the [Signing API](/wallets/signing-apis), you must
manage the transaction broadcasting and indexing with your blockchain
infrastructure.

<Note>
  If it has been over 14 days or you end the last trial attempt since you first
  ran the sample app, your session is logged out. You must run the sample app
  and acquire a new user token to proceed further. For instructions, see the
  perform login part of [Create Your First Wallet with Social
  Logins](/wallets/user-controlled/create-your-first-wallet-with-social-logins)
  or [Create Your First Wallet with Email
  Authentication](/wallets/user-controlled/create-your-first-wallet-with-email).
</Note>

## Step 1. Check wallet balance and obtain token ID

Before making an outbound transfer, you must have a token ID and token balance
greater than `0`.

1. Include `userToken` copied from the previous step in the header of a `GET`
   request to the `/wallets` endpoint.
2. From the response, copy `id` which is your wallet ID.

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

3. Using `id` which you just copied, send a `GET` request to the
   `/wallet/{id}/balances` endpoint to check your wallet's token balance.\
   From the response, copy and store the `tokenId` that you intend to transfer.

<CodeGroup>
  ```javascript Node.js SDK theme={null}
    const response = await circleUserSdk.getWalletTokenBalance({
    userToken: '<USER_TOKEN>',
    walletId: '<WALLET_ID>'
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

## Step 2. Estimate the cost of transaction (optional)

To estimate the fees for the transaction to transfer tokens, send a `POST`
request to the `transactions/transfer/estimateFee` endpoint.

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

## Step 3. Initiate a blockchain transaction

### Execute an asset transfer

To initiate a blockchain transfer from a specified wallet to a blockchain
address:

1. Include `walletId` and `destinationAddress` in a `POST` request to the
   `/user/transactions/transfer` endpoint.
2. From the response, copy `challengeId` for the next step.

### Execute a contract

To create a transaction that executes a smart contract:

1. Include `walletId` and `contractAddress` in a `POST` request to the
   `/user/transactions/contractExecution` endpoint.
2. From the response, copy `challengeId` and enter it in the sample app.

<Note>
  If you do not have a wallet to use as a destination for the transfer, you can
  create another user-controlled wallet or send funds to any other blockchain
  wallet such as Metamask.
</Note>

## Step 4. Confirm execution

To authorize a transfer on the sample app's confirmation UI, ensure you have
obtained an active user token and encryption key.

* From the Execute Challenge screen in the sample app, paste the Challenge ID
  that you copied from the previous step and select **Execute**.

  <Frame>
    <img src="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=b8e0c4f832de03ad4656e121fcba98f8" data-og-width="480" width="480" data-og-height="500" height="500" data-path="w3s/images/ucw-sotec-execchall01.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?w=280&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=b91f13cc54eb70b332857fce537edf89 280w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?w=560&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=1d17f24318aa2e00ef6b8957991fb808 560w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?w=840&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=73b69cd7b652440bba9046933d43a201 840w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?w=1100&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=451dc686a6f543bf365f777f86bd3dde 1100w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?w=1650&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=cfa48e5369242a53f6cd6faa15046fe1 1650w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-execchall01.svg?w=2500&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=b5ba42144f8ba411135537221a3e3a1b 2500w" />
  </Frame>

  The sample app displays a confirmation UI that contains transaction details
  for the user to confirm. You can customize confirmation UIs. For more, see
  [Confirmation UIs](/wallets/user-controlled/confirmation-uis) .

  <Frame>
    <img src="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=3bc4e1eb522e713ce295b48cd07c4099" data-og-width="482" width="482" data-og-height="642" height="642" data-path="w3s/images/ucw-sotec-confirmtrx01.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?w=280&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=2999b564ef26ac6dcf02e63f6f6d792f 280w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?w=560&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=2367b5518d09b5d3189ef02fc8831290 560w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?w=840&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=9c3d56d1e76a0456c21a038647f2b412 840w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?w=1100&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=08d9b6f2372ee2225f1cd1d5fa47b9c3 1100w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?w=1650&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=38b6e1cdcfe1fefe36b525f56a1b16ea 1650w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-confirmtrx01.svg?w=2500&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=83d88a07c49b8036157286748b5b6f24 2500w" />
  </Frame>

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=0454a5f9b45448bd7c1356ef8255b664" data-og-width="482" width="482" data-og-height="851" height="851" data-path="w3s/images/ucw-sotec-contractint01.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?w=280&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=5272f883ded40b381b38779e3105fa4c 280w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?w=560&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=d7c1a4d8cbb9a6272e8270c27db15d43 560w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?w=840&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=4ac69551640dcec414a0a7fafbb47969 840w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?w=1100&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=f25cc5851daafe766c0fbda7ab237f91 1100w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?w=1650&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=76f5acfae842c1c7fdd454520fe05870 1650w, https://mintcdn.com/circle-167b8d39/ilQRXPPagmT4tMsq/w3s/images/ucw-sotec-contractint01.svg?w=2500&fit=max&auto=format&n=ilQRXPPagmT4tMsq&q=85&s=30467f63b2ed502d8282ebeb4ca6f33c 2500w" />
</Frame>

## Step 5. Check transaction status

As the transfer transaction's `state` changes and ultimately completes, Circle
sends webhook notifications to a
[subscriber endpoint](/wallets/webhook-notifications). For a list of all
possible states, see
[Asynchronous States and Statuses](/w3s/asynchronous-states-and-statuses).

The following code sample shows an example of a webhook notification for a
transfer.

```json JSON theme={null}
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

You can also include your user's `userId` or `userToken` in a `GET` request to
the `/transactions` endpoint.

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

The following code sample shows the response.

```json JSON theme={null}
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
