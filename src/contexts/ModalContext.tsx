"use client";

import React, { createContext, useContext, useState } from "react";
import type { PageData } from "@/lib/api/types";

export type ModalType =
  | "CREATE_PAGE"
  | "EDIT_PAGE"
  | "EDIT_PROFILE"
  | "CHANGE_PASSWORD"
  | null;

interface ModalData {
  editPageData?: PageData | null;
}

interface ModalContextType {
  activeModal: ModalType;
  modalData: ModalData;
  openModal: (modal: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  isModalOpen: (modal: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData>({});

  const openModal = (modal: ModalType, data: ModalData = {}) => {
    setActiveModal(modal);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
  };

  const isModalOpen = (modal: ModalType) => {
    return activeModal === modal;
  };

  return (
    <ModalContext.Provider
      value={{
        activeModal,
        modalData,
        openModal,
        closeModal,
        isModalOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
