export const defaultSupportEmail = "support@dancrushop.com";

export function getSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || defaultSupportEmail;
}

export function getSupportMailto(subject = "DanCruShop support") {
  return `mailto:${getSupportEmail()}?subject=${encodeURIComponent(subject)}`;
}

export const betaPolicies = {
  delivery:
    "Lemon Squeezy mở khóa tự động sau thanh toán. VietQR được duyệt thủ công trong vòng 24h.",
  refund:
    "Hoàn tiền trong 7 ngày nếu sản phẩm không truy cập được, lỗi nghiêm trọng, hoặc mô tả sai. Không áp dụng khi tài nguyên đã được tải/sử dụng đầy đủ hoặc đổi ý sau khi đã nhận file.",
  support: "Email support phản hồi trong 24h trong giai đoạn beta.",
};

export const policyLinks = [
  {
    href: "/delivery-policy",
    label: "Giao hàng",
  },
  {
    href: "/refund-policy",
    label: "Hoàn tiền",
  },
  {
    href: "/support",
    label: "Support",
  },
] as const;
