"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImageToIPFS, uploadMetadataToIPFS } from "@/lib/ipfs/upload";
import { validateMetadata, type Metadata, type Attribute } from "@/lib/validation/metadata";

type Phase = 0 | 1 | 2 | 3;

export default function MetadataManager() {
  const [phase, setPhase] = useState<Phase>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mainImage, setMainImage] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState("");

  // Image Upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    try {
      const urls = await Promise.all(
        acceptedFiles.map((file) => uploadImageToIPFS(file))
      );
      if (urls.length > 0 && !mainImage) {
        setMainImage(urls[0]);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload images");
    } finally {
      setLoading(false);
    }
  }, [mainImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    multiple: true,
  });

  // Attributes
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

  // Upload Metadata
  const handleUpload = async () => {
    if (!name || !description || !mainImage) {
      alert("Please fill name, description, and upload at least one image");
      return;
    }

    setLoading(true);
    try {
      const metadata: Metadata = {
        name,
        description,
        image: mainImage,
        attributes,
        media: {
          images,
          videos: [],
          floor_plans: [],
          documents: [],
        },
        properties: {
          auction: {
            phase,
            started: false,
            ended: false,
          },
          revealed: phase === 0 ? 30 : phase === 1 ? 60 : phase === 2 ? 100 : 100,
          next_reveal: phase < 3 ? `Phase ${phase + 1}` : undefined,
        },
      };

      // Validate
      validateMetadata(metadata);

      // Upload to IPFS
      const url = await uploadMetadataToIPFS(metadata);
      setIpfsUrl(url);
      alert(`Metadata uploaded successfully!\n\n${url}`);
    } catch (error) {
      console.error("Failed to upload metadata:", error);
      alert(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">📝 Metadata Manager</h2>

      {/* Phase Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Revelation Phase
        </label>
        <div className="flex gap-2">
          {([0, 1, 2, 3] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                phase === p
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Phase {p} ({p === 0 ? "30%" : p === 1 ? "60%" : "100%"})
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          NFT Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Luxury House in Cali, Colombia"
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the property..."
          rows={4}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Images
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-purple-500 bg-purple-500/10"
              : "border-white/20 hover:border-white/40"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-400">
            {isDragActive
              ? "Drop images here..."
              : "Drag & drop images, or click to select"}
          </p>
        </div>

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Upload ${i}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {i === 0 && (
                  <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attributes */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Attributes
          </label>
          <button
            onClick={addAttribute}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            + Add Attribute
          </button>
        </div>

        <div className="space-y-2">
          {attributes.map((attr, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={attr.trait_type}
                onChange={(e) => updateAttribute(i, "trait_type", e.target.value)}
                placeholder="Trait (e.g., Bedrooms)"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateAttribute(i, "value", e.target.value)}
                placeholder="Value (e.g., 5)"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => removeAttribute(i)}
                className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
      >
        {loading ? "Uploading..." : "🚀 Upload to IPFS"}
      </button>

      {/* Result */}
      {ipfsUrl && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 font-semibold mb-2">✅ Upload Successful!</p>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline break-all"
          >
            {ipfsUrl}
          </a>
        </div>
      )}
    </div>
  );
}
