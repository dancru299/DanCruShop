import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type VerificationPurpose = "signup" | "password_reset";

type VerificationCodeEmailProps = {
  code: string;
  purpose: VerificationPurpose;
};

const COPY: Record<
  VerificationPurpose,
  { heading: string; intro: string; preview: string }
> = {
  signup: {
    heading: "Xác nhận đăng ký DanCruShop",
    intro:
      "Nhập mã bên dưới để kích hoạt tài khoản DanCruShop của bạn.",
    preview: "Mã kích hoạt tài khoản DanCruShop của bạn.",
  },
  password_reset: {
    heading: "Đặt lại mật khẩu DanCruShop",
    intro:
      "Nhập mã bên dưới để đặt lại mật khẩu cho tài khoản DanCruShop của bạn.",
    preview: "Mã đặt lại mật khẩu DanCruShop của bạn.",
  },
};

export default function VerificationCodeEmail({
  code,
  purpose,
}: VerificationCodeEmailProps) {
  const copy = COPY[purpose];

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{copy.heading}</Heading>
          <Text style={text}>{copy.intro}</Text>
          <Section style={codeSection}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={mutedText}>
            Mã có hiệu lực trong 10 phút và chỉ dùng được một lần. Nếu bạn không
            yêu cầu, hãy bỏ qua email này.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>DanCruShop</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f6f6",
  color: "#171717",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: "0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  margin: "40px auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading = {
  fontSize: "26px",
  lineHeight: "1.2",
  margin: "0 0 16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 24px",
};

const codeSection = {
  backgroundColor: "#f4f4f5",
  borderRadius: "10px",
  margin: "8px 0 24px",
  padding: "20px",
  textAlign: "center" as const,
};

const codeText = {
  color: "#171717",
  fontSize: "34px",
  fontWeight: "700",
  letterSpacing: "10px",
  margin: "0",
};

const mutedText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "32px 0 16px",
};

const footer = {
  color: "#737373",
  fontSize: "13px",
  margin: "0",
};
