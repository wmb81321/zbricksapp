# Skill: NFT Metadata Builders

## What This Covers
Building, validating, and uploading NFT metadata with progressive revelation phases. Used for real estate NFTs where property details are revealed in stages.

## Key Pattern: Zod Schema Validation

```typescript
// lib/validation/metadata.ts
import { z } from "zod";

const AttributeSchema = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number()]),
  display_type: z.string().optional(),
});

const MediaSchema = z.object({
  images: z.array(z.string().url()),
  videos: z.array(z.string().url()).optional(),
  floor_plans: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),
});

const PropertiesSchema = z.object({
  auction: z.object({
    phase: z.number().min(0).max(3),
    started: z.boolean(),
    ended: z.boolean(),
  }),
  revealed: z.number().min(0).max(100),
  next_reveal: z.string().optional(),
});

export const MetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image: z.string().url(),
  attributes: z.array(AttributeSchema),
  media: MediaSchema,
  properties: PropertiesSchema,
});

export type Metadata = z.infer<typeof MetadataSchema>;
export type Attribute = z.infer<typeof AttributeSchema>;

export function validateMetadata(data: unknown): Metadata {
  return MetadataSchema.parse(data);
}
```

## Key Pattern: Building Metadata Object Per Phase

```typescript
// Phase-aware metadata construction
const metadata: Metadata = {
  name,
  description,
  image: mainImage,      // Main image URL from IPFS
  attributes,            // Dynamic key-value pairs (Bedrooms: 5, etc.)
  media: {
    images,              // Array of IPFS image URLs
    videos: [],
    floor_plans: [],
    documents: [],
  },
  properties: {
    auction: {
      phase,             // 0-3
      started: false,
      ended: false,
    },
    // Progressive revelation percentages per phase
    revealed: phase === 0 ? 30 : phase === 1 ? 60 : phase === 2 ? 100 : 100,
    next_reveal: phase < 3 ? `Phase ${phase + 1}` : undefined,
  },
};

// Validate before upload
validateMetadata(metadata);
```

## Key Pattern: IPFS Upload (Pinata)

```typescript
// lib/ipfs/upload.ts
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API = "https://api.pinata.cloud/pinning";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

// Upload image file
export async function uploadImageToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${PINATA_API}/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  const data = await response.json();
  return `${PINATA_GATEWAY}/${data.IpfsHash}`;
}

// Upload JSON metadata
export async function uploadMetadataToIPFS(metadata: Record<string, unknown>): Promise<string> {
  const response = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `zkbricks-metadata-${Date.now()}.json` },
    }),
  });

  const data = await response.json();
  return `${PINATA_GATEWAY}/${data.IpfsHash}`;
}
```

## Key Pattern: Drag & Drop Image Upload with react-dropzone

```typescript
import { useDropzone } from "react-dropzone";

const onDrop = useCallback(async (acceptedFiles: File[]) => {
  setLoading(true);
  try {
    const urls = await Promise.all(
      acceptedFiles.map((file) => uploadImageToIPFS(file))
    );
    if (urls.length > 0 && !mainImage) {
      setMainImage(urls[0]); // First image becomes main
    }
    setImages((prev) => [...prev, ...urls]);
  } finally {
    setLoading(false);
  }
}, [mainImage]);

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: { "image/*": [".png", ".jpg", ".jpeg"] },
  multiple: true,
});
```

## Key Pattern: Dynamic Attributes Management

```typescript
const [attributes, setAttributes] = useState<Attribute[]>([]);

const addAttribute = () => {
  setAttributes([...attributes, { trait_type: "", value: "" }]);
};

const updateAttribute = (index: number, field: "trait_type" | "value", value: string) => {
  const updated = [...attributes];
  updated[index][field] = value;
  setAttributes(updated);
};

const removeAttribute = (index: number) => {
  setAttributes(attributes.filter((_, i) => i !== index));
};
```

## Key Pattern: Fetching Metadata from Contract

```typescript
// Read tokenURI from NFT contract -> returns IPFS URL
export async function getNFTMetadata(): Promise<NFTMetadata> {
  const contract = getHouseNFTContract();
  const tokenId = BigInt(1);

  const [owner, currentPhase, tokenURI] = await Promise.all([
    contract.ownerOf(tokenId),
    contract.currentPhase(),
    contract.tokenURI(tokenId),
  ]);

  return { tokenId, owner, currentPhase: Number(currentPhase), tokenURI };
}

// Get phase-specific metadata URI
export async function getPhaseURI(phase: number): Promise<string> {
  const contract = getHouseNFTContract();
  return await contract.getPhaseURI(phase);
}
```

## When To Use
- Any NFT project with structured metadata (OpenSea-compatible)
- Progressive metadata revelation (gaming, real estate, mystery NFTs)
- Projects needing IPFS storage via Pinata
- Admin panels for metadata management
