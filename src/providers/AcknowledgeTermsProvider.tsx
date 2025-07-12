"use client";

import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

const ACKNOWLEDGEMENT_LOCAL_STORAGE_KEY = "acknowledge-terms";

type AcknowledgeTermsContextType = {
  acknowledgedTerms: boolean;
  setAcknowledgement: () => void;
};

const AcknowledgeTermsContext = createContext<AcknowledgeTermsContextType | undefined>(undefined);

export function AcknowledgeTermsProvider({ children }: PropsWithChildren) {
  const [acknowledgedTerms, setAcknowledgedTerms] = useState(false);

  // On load, check if we already accepted the terms before
  useEffect(() => {
    const storedAcknoledgement = localStorage.getItem(ACKNOWLEDGEMENT_LOCAL_STORAGE_KEY);
    setAcknowledgedTerms(storedAcknoledgement === "true");
  }, []);

  const setAcknowledgement = useCallback(() => {
    localStorage.setItem(ACKNOWLEDGEMENT_LOCAL_STORAGE_KEY, "true");
    setAcknowledgedTerms(true);
  }, []);

  return (
    <AcknowledgeTermsContext.Provider value={{ acknowledgedTerms, setAcknowledgement }}>
      {children}
    </AcknowledgeTermsContext.Provider>
  );
}

export function useAcknowledgeTermsContext() {
  const context = useContext(AcknowledgeTermsContext);
  if (!context) {
    throw new Error("useAcknowledgeTermsContext must be used within an AcknowledgeTermsProvider");
  }
  return context;
}
