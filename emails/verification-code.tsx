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
    heading: "Confirm your DanCruShop sign-up",
    intro:
      "Enter the code below to activate your DanCruShop account.",
    preview: "Your DanCruShop account activation code.",
  },
  password_reset: {
    heading: "Reset your DanCruShop password",
    intro:
      "Enter the code below to reset the password for your DanCruShop account.",
    preview: "Your DanCruShop password reset code.",
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
            The code is valid for 10 minutes and can be used only once. If you
            didn&apos;t request it, you can ignore this email.
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
