"use client";

import { createContext, useContext, useMemo } from "react";
import { useMenuItems } from "@/hooks/use-menu-items";
import { useOrders } from "@/hooks/use-orders";
import { useWaiterRequests } from "@/hooks/use-waiter-requests";
import type { MenuItem, OrderRecord, WaiterRequest } from "@/lib/types";

type AdminDataContextValue = {
  menuItems: MenuItem[];
  menuLoading: boolean;
  menuError: string | null;
  orders: OrderRecord[];
  ordersLoading: boolean;
  ordersError: string | null;
  requests: WaiterRequest[];
  requestsLoading: boolean;
  requestsError: string | null;
};

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { menuItems, loading: menuLoading, error: menuError } = useMenuItems();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { requests, loading: requestsLoading, error: requestsError } = useWaiterRequests();

  const value = useMemo<AdminDataContextValue>(
    () => ({
      menuError,
      menuItems,
      menuLoading,
      orders,
      ordersError,
      ordersLoading,
      requests,
      requestsError,
      requestsLoading,
    }),
    [menuError, menuItems, menuLoading, orders, ordersError, ordersLoading, requests, requestsError, requestsLoading],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }

  return context;
}
