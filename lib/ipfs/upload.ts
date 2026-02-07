const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API = "https://api.pinata.cloud/pinning";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadImageToIPFS(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT not configured");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${PINATA_API}/pinFileToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image: ${error}`);
  }

  const data: PinataResponse = await response.json();
  return `${PINATA_GATEWAY}/${data.IpfsHash}`;
}

export async function uploadMetadataToIPFS(
  metadata: Record<string, unknown>
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT not configured");
  }

  const response = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `zkbricks-metadata-${Date.now()}.json`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload metadata: ${error}`);
  }

  const data: PinataResponse = await response.json();
  return `${PINATA_GATEWAY}/${data.IpfsHash}`;
}
