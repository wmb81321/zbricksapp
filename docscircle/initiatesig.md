> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Initiate a Signature Request

> Learn how to initiate a signature request from a user-controlled wallet with social logins or email authentication

This guide outlines initiating a signature request from a previously created
user-controlled wallet with social logins or email authentication. To create a
wallet, see
[Create Your First Wallet with Social Logins](/wallets/user-controlled/create-your-first-wallet-with-social-logins)
or
[Create Your First Wallet with Email](/wallets/user-controlled/create-your-first-wallet-with-email).

<Note>
  If it has been over 14 days or you end the last trial attempt since you first
  ran the sample app, your session is logged out. You must run the sample app
  and acquire a new user token to proceed further. For instructions, see the
  perform login part of [Create Your First Wallet with Social
  Logins](/wallets/user-controlled/create-your-first-wallet-with-social-logins)
  or [Create Your First Wallet with Email
  Authentication](/wallets/user-controlled/create-your-first-wallet-with-email).
</Note>

## Step 1. Initiate a signature request

1. Sign the transaction, EIP-191 message, or EIP-712 typed structure data from a
   specified user-controlled wallet:
   * For a transaction, include `walletId` and `transaction` object or
     `rawTransaction` string in a `POST` request to the `/user/sign/transaction`
     endpoint.
   * For EIP-191, include `walletId` and `message` in a `POST` request to the
     `/user/sign/message` endpoint.
   * For EIP-712, include `walletId` and `data` in a `POST` request to the
     `/user/sign/typedData` endpoint.
2. From the response, copy `challengeId` for the next step.

## Step 2. Perform signing

To perform signing on the sample app's confirmation UI, ensure you have obtained
an active user token and encryption key.

From the Execute Challenge screen, paste the Challenge ID and select
**Execute**.

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=af800d04de0a4c13cc5ab5041b9aa8da" data-og-width="480" width="480" data-og-height="500" height="500" data-path="w3s/images/ucw-isr-execchall01.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?w=280&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=54d26cc5781df0617bf5658e6e83d5ce 280w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?w=560&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=e3e1046ec98c701790c6f371b2317499 560w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?w=840&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=0673ece4e35117be74703569e8dd6c66 840w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?w=1100&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=88b7ee5f0658f155b756d60bab2abfec 1100w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?w=1650&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=f3eccacf8f49869db1c1a2c9aa605dd4 1650w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-execchall01.svg?w=2500&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=692df3b20e1f961d9752ec497c326805 2500w" />
</Frame>

## Step 3. Confirm signature request

The sample app prompts a confirmation UI for the user to view the signing
details and confirm it. You can customize confirmation UIs. For more, see
[Confirmation UIs](/wallets/user-controlled/confirmation-uis) .

<Frame>
  <img src="https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=0d8ae8d1a475d1fbc74bb615c0db45e0" data-og-width="480" width="480" data-og-height="640" height="640" data-path="w3s/images/ucw-isr-sigrec01.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?w=280&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=609fe06982b9f3c98c225e7073e449b9 280w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?w=560&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=cce0f92dabd6f56ed7f94f14832db2d1 560w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?w=840&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=e836fdd81ca7219d0bb5af6d4ede1b6c 840w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?w=1100&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=b3f86d1f74303439536f497329e3bc5d 1100w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?w=1650&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=85e6a08b51ab2c1842f5728ed254e9f1 1650w, https://mintcdn.com/circle-167b8d39/Y3M1-hPSLXlEtSe1/w3s/images/ucw-isr-sigrec01.svg?w=2500&fit=max&auto=format&n=Y3M1-hPSLXlEtSe1&q=85&s=6e7b51e307c07a5f8035a676a1c0cfdf 2500w" />
</Frame>
