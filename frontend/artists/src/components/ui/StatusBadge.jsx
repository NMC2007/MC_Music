import React from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

/**
 * StatusBadge: Huy hiệu hiển thị trạng thái kiểm duyệt bài hát / album
 * - PENDING: Chờ kiểm duyệt (Vàng)
 * - APPROVED: Đã duyệt / Công khai (Xanh lá)
 * - REJECTED: Bị từ chối (Đỏ)
 * - TAKEDOWN: Đã gỡ bỏ (Xám)
 */
export const StatusBadge = ({ status, size = "md", className = "" }) => {
  const normalizedStatus = (status || "").toUpperCase();

  const configMap = {
    PENDING: {
      label: "Chờ kiểm duyệt",
      icon: Clock,
      classes: "bg-amber-500/15 text-amber-400",
      dotClass: "bg-amber-400",
    },
    APPROVED: {
      label: "Đã công khai",
      icon: CheckCircle2,
      classes: "bg-emerald-500/15 text-emerald-400",
      dotClass: "bg-emerald-400",
    },
    REJECTED: {
      label: "Bị từ chối",
      icon: XCircle,
      classes: "bg-rose-500/15 text-rose-400",
      dotClass: "bg-rose-400",
    },
    TAKEDOWN: {
      label: "Đã gỡ bỏ",
      icon: AlertTriangle,
      classes: "bg-neutral-800 text-neutral-400",
      dotClass: "bg-neutral-500",
    },
  };

  const current = configMap[normalizedStatus] || {
    label: normalizedStatus || "Không xác định",
    icon: Clock,
    classes: "bg-neutral-800 text-neutral-400",
    dotClass: "bg-neutral-400",
  };

  const Icon = current.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
    lg: "text-sm px-3 py-1.5 gap-2 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none tracking-wide ${current.classes} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <Icon size={size === "sm" ? 12 : 14} className="flex-shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusBadge;
