"use client";

import { useState, useEffect } from "react";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      const walletAddress = localStorage.getItem("walletAddress")?.toLowerCase();
      setIsAdmin(!!(walletAddress && walletAddress === ADMIN_ADDRESS));
      setIsLoading(false);
    };

    checkAdmin();
  }, []);

  return { isAdmin, isLoading };
}
