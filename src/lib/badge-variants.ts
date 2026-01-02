import { Badge } from "@/components/ui/badge";

export type StatusType = "active" | "inactive" | "suspended";
export type OrderStatusType = "Accepted" | "Printed" | "Shipped" | "Cancelled" | "Refunded" | "Canceled";
export type CustomerStatus = "active" | "inactive" | "cancelled" | "terminated" | "suspended";

export const getStatusBadgeVariant = (
  status: CustomerStatus
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",        // green
    inactive: "secondary",    // gray
    cancelled: "destructive", // red
    terminated: "destructive", // red
    suspended: "destructive", // red (kept for backward compatibility)
  };

  return variants[status] ?? "secondary"; // fallback
}
export const getOrderStatusBadgeVariant = (status: OrderStatusType): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<OrderStatusType, "default" | "secondary" | "destructive" | "outline"> = {
    Accepted: "default",
    Printed: "secondary",
    Shipped: "outline",
    Cancelled: "destructive",
    Canceled:"destructive",
    Refunded: "secondary",
  };
  return variants[status] || "default";
};
