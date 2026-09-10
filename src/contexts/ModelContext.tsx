import React, { createContext, useContext, useState, useEffect } from "react";
import { StorageService } from "../services/StorageService";

type ModelType = "llama3" | "qwen2-math";

interface ModelContextType {
  model: ModelType;
  setModel: (model: ModelType) => Promise<void>;
  getLanguage: () => string;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [model, setModelState] = useState<ModelType>("llama3");
  const [isLoading, setIsLoading] = useState(true);

  // Load model from storage on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        const savedModel = (await StorageService.getModel()) as ModelType;
        setModelState(savedModel || "llama3");
      } catch (error) {
        console.error("Erro ao carregar modelo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
  }, []);

  const setModel = async (newModel: ModelType) => {
    // Atualiza primeiro a fonte visual/funcional em memória. O armazenamento é
    // persistência, não deve atrasar a troca do tutor ativo.
    setModelState(newModel);
    try {
      await StorageService.saveModel(newModel);
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
    }
  };

  const getLanguage = (): string => {
    // Return the appropriate language code for TTS based on model
    return model === "llama3" ? "en-US" : "pt-BR";
  };

  const value: ModelContextType = {
    model,
    setModel,
    getLanguage,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel deve ser usado dentro de ModelProvider");
  }
  return context;
};
